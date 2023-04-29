import React, { useState, useEffect } from 'react';

const SerialConsole = () => {
    const [port, setPort] = useState(null);
    const [output, setOutput] = useState('');
    const [input, setInput] = useState('');

    useEffect(() => {
        if (!navigator.serial) {
            console.warn('Web Serial API not supported');
        }
    }, []);

    useEffect(() => {
        let reader;
        let active = true;

        const readData = async () => {
            while (port && port.readable && active) {
                try {
                    reader = port.readable.getReader();
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        setOutput((prevOutput) => prevOutput + new TextDecoder().decode(value));
                    }
                } catch (err) {
                    console.error('Failed to read data:', err);
                } finally {
                    reader && reader.releaseLock();
                }
            }
        };

        readData();

        return () => {
            active = false;
            reader && reader.releaseLock();
        };
    }, [port]);

    const connect = async () => {
        try {
            const newPort = await navigator.serial.requestPort();
            await newPort.open({ baudRate: 9600 });
            setPort(newPort);
        } catch (err) {
            console.error('Failed to connect:', err);
        }
    };

    const sendData = async (data) => {
        if (!port || !port.writable) return;

        const writer = port.writable.getWriter();
        const encodedData = new TextEncoder().encode(data + '\x0D');

        try {
            await writer.write(encodedData);
        } catch (err) {
            console.error('Failed to send data:', err);
        } finally {
            writer.releaseLock();
        }
    };

    const disconnect = async () => {
        if (!port) return;

        await port.close();
        setPort(null);
        setOutput('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendData(input);
        setInput('');
    };

    return (
        <div>
            <h2>Serial Console</h2>
            {port ? (
                <button onClick={disconnect}>Disconnect</button>
            ) : (
                <button onClick={connect}>Connect</button>
            )}
            <div>
                <pre>{output}</pre>
            </div>
            {port && (
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button type="submit">Send</button>
                </form>
            )}
        </div>
    );
};

export default SerialConsole;
