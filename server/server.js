const io = require('socket.io')(3001, {
    cors:{
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

let cursorId = 0;

io.on("connection", socket => {
    socket.on("send-changes", delta => {
        console.log(delta);
        socket.broadcast.emit("receive-changes", delta);
    });

    socket.on("send-selection", (selectionRange) => {
        console.log("Server side");
        socket.broadcast.emit("receive-selection", selectionRange);
    });

    socket.on("mouse-move", (position) => {
        const id = cursorId++;
        socket.broadcast.emit("cursor-positions", { id, ...position });
    });

    socket.on("disconnect", () => {
        // Clean up cursor position when client disconnects
        socket.broadcast.emit("cursor-disconnect", socket.id);
    });
});
