import * as udp from 'dgram'
import * as fs from 'fs'
import path from 'path'

// Port on controller boards to send LED data to
const CONTROLLER_PORT = 10460

interface SegmentConfig {
    numLeds: number
    paths: Array<{
        startIndex: number
        numLeds: number
    }>
}

const config = JSON.parse(fs.readFileSync('dome.json').toString())
const mappings = JSON.parse(fs.readFileSync('mappings.json').toString()).mappings

const segments: Map<number, SegmentConfig> = new Map()
for (const [i, segment] of config.segments.entries()) {
    const paths: SegmentConfig['paths'] = []
    let numLeds = 0
    for (const path of segment.paths) {
        const leds = path.struts.reduce((prev: number, curr: { leds: Array<number[]> }) => prev + curr.leds.length, 0)
        paths.push({
            startIndex: numLeds,
            numLeds: leds
        })
        numLeds += leds
    }
    segments.set(i, {
        numLeds,
        paths
    })
}

const pathToName = new Map()
const pathToIp = new Map()
const pathToSocket = new Map()
for (const mapping of mappings) {
    pathToName.set(mapping.path, mapping.name)
    pathToIp.set(mapping.path, mapping.ip)
    const socket = udp.createSocket('udp4')
    socket.bind(0)
    pathToSocket.set(mapping.path, socket)
}

console.log(`Dome:`)
for (const [i, segment] of segments.entries()) {
    console.log(`Segment ${i} | Leds: ${segment.numLeds} | Paths: ${segment.paths.map((p) => `${p.startIndex}-${p.startIndex + p.numLeds}`).join(',')}`)
}
console.log()

console.log(`Mappings:`)
for (let i = 0; i < 25; i++) {
    const name = pathToName.get(i)
    const ip = pathToIp.get(i)

    console.log(`Path ${i.toString().padStart(2, '0')} | ${ip} ${name}`)
}
console.log()

const udpServer = udp.createSocket('udp4')
udpServer.bind(1337)

udpServer.on('listening',function(){
    var address = udpServer.address();
    var port = address.port;
    var family = address.family;
    var ipaddr = address.address;
    console.log(`Server is listening at port ${port}`);
    console.log(`Server ip: ${ipaddr}`);
    console.log(`Server is IP4/IP6: ${family}`);
});

udpServer.on('message', (msg, _remote) => {
    // const time = (new Date()).toISOString()
    // console.log(`[${time}] Data received from client for segment ${msg[0]}`)
    // console.log(`[${time}] Received ${msg.length} bytes (${(msg.length - 1) / 3} RGB values) from ${remote.address}:${remote.port}`)

    const segmentId = msg[0]
    if (segmentId > segments.size - 1) return

    const packet = msg.slice(1)
    const segmentConfig = segments.get(segmentId)
    if (!segmentConfig) return
    if (packet.length !== segmentConfig.numLeds * 3) return

    for (const [i, path] of segmentConfig.paths.entries()) {
        const pathId = (segmentId * 5) + i
        const pathIp = pathToIp.get(pathId)
        if (!pathIp) return
        const socket = pathToSocket.get((segmentId * 5) + i)
        if (!socket) return
        const values = packet.slice(path.startIndex, path.startIndex + (path.numLeds * 3))
        socket.send(values, CONTROLLER_PORT, pathIp)
    }
})
