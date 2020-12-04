const socketCon = (io) => {
    io.on('connection', (socket) => {
        console.log(`New WS Connection...`)

        // 所有on與emit都是寫在socket裡，如socket.on()、socket.emit()
        // on()與emit()中的事件名稱都是一對的
        // socket.on()
        // socket.emit()
        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    })
}

module.exports = {
    socketCon
};