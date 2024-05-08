import React, { useState, useEffect, useCallback } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from 'socket.io-client';


export default function TextEditor() {
    const [socket, setSocket] = useState();
    const [quill, setQuill] = useState();


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
            quill.updateContents(delta)
        }

        socket.on('receive-changes', handler)

        return () => {
            socket.off('receive changes', handler)
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

        quill.on('text-change', textChangeHandler);

        return () => {
            quill.off('text-change', textChangeHandler);
        }
    }, [socket, quill])


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
