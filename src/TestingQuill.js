import React, { useState, useEffect, useCallback } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from 'socket.io-client';


export default function TestingQuill() {
    const [socket, setSocket] = useState();
    const [quill, setQuill] = useState();
    const [cursorPositions, setCursorPositions] = useState({});


    useEffect(() =>{
        const s = io("http://localhost:3001");
        setSocket(s);

        return () => {
            s.disconnect();
        }
    }, []);


    useEffect(() => {
        if(socket == null || quill == null)
            return;
        
        const handler = (delta) => {
            console.log("updating quill with new delta")
            quill.updateContents(delta);
        }

        socket.on('receive-changes', handler);

        return () => {
            socket.off('receive-changes', handler);
        }
    }, [socket, quill])



    useEffect(() => {
        if(socket == null || quill == null)
            return;

        const receiveSelectionHandler = (selectionRange) => {
            console.log("user is selecting text...");
            quill.setSelection(selectionRange["start"], selectionRange["end"]);
        }

        socket.on('receive-selection', receiveSelectionHandler);

        return () => {
            socket.off('receive-selection', receiveSelectionHandler)
        }
    }, [socket, quill])



    useEffect(() => {
        if(socket == null || quill == null)
            return;

        const textChangeHandler = (delta, oldDelta, source) => {
            if(source !== 'user')
                return;
            socket.emit("send-changes", delta);
        }

        const selectionChangeHandler = (range, oldRange, source) => {
            if(source !== 'user')
                return;
            socket.emit("send-selection", {"start": range.index, "end": range.length});
        }

        quill.on('text-change', textChangeHandler);
        quill.on('selection-change', selectionChangeHandler);

        return () => {
            quill.off('text-change', textChangeHandler);
        }
    }, [socket, quill]);


    useEffect(() => {
        if (socket == null)
            return;

        const handleMouseMove = (event) => {
            const { clientX, clientY } = event;
            socket.emit("mouse-move", { x: clientX, y: clientY });
        };

        document.addEventListener("mousemove", handleMouseMove);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
        };
    }, [socket]);


    useEffect(() => {
        if (socket == null)
            return;

        const handleCursorPositions = (positions) => {
            setCursorPositions((prev) => ({
                ...prev,
                [positions.id]: positions,
            }));

            console.log(positions);
        };

        socket.on("cursor-positions", handleCursorPositions);

        return () => {
            socket.off("cursor-positions", handleCursorPositions);
        };
    }, [socket]);




    const wrapperRef = useCallback((wrapper) => {
        if(wrapper == null)
            return;

        wrapper.innerHTML = "";
        const editor = document.createElement('div');
        wrapper.append(editor);

        const q = new Quill(editor, { theme: "snow" });
        setQuill(q);

        return () => {
            wrapperRef.innerHTML= "";
        }

    }, []);


    return <div className="container" ref={wrapperRef}></div>;
}