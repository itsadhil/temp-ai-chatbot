"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, BarChart3Icon, FileTextIcon, LineChartIcon, CalculatorIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { chat } from "@/actions/chat";
import { readStreamableValue } from "ai/rsc";
import { cn } from "@/lib/utils";
import MarkdownRenderer from "./markdown-renderer";

let pdfjsLib: any = null; // Declare pdfjsLib variable

if (typeof window !== "undefined") {
    // Dynamically import pdfjs-dist only in the browser
    pdfjsLib = require("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs"; // Use the locally hosted worker
}

const prompts = [
    {
        icon: <CalculatorIcon strokeWidth={1.8} className="size-5" />,
        text: "Generate the monthly income statement",
    },
    {
        icon: <LineChartIcon strokeWidth={1.8} className="size-5" />,
        text: "Provide a 12-month cash flow forecast",
    },
    {
        icon: <FileTextIcon strokeWidth={1.8} className="size-5" />,
        text: "Book a journal entry",
    },
    {
        icon: <BarChart3Icon strokeWidth={1.8} className="size-5" />,
        text: "Create a real-time financial dashboard",
    },
];

export type Message = {
    role: "user" | "assistant";
    content: string;
};

const Chatbot = () => {
    const messageEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);

    const [input, setInput] = useState<string>("");
    const [conversation, setConversation] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasStartedChat, setHasStartedChat] = useState<boolean>(false);
    const [uploadedFile, setUploadedFile] = useState<{ name: string; status: string } | null>(null);
    const [pdfContent, setPdfContent] = useState<string>(""); // Store extracted PDF content

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [input]);

    const extractTextFromPDF = async (file: File): Promise<string> => {
        if (!pdfjsLib) {
            throw new Error("pdfjsLib is not available in the current environment.");
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item: any) => item.str).join(" ");
            text += pageText + "\n";
        }
        return text;
    };

    const handleFileUpload = async (file: File) => {
        setUploadedFile({ name: file.name, status: "Uploading..." });

        try {
            // Extract text from the PDF using pdfjs-dist
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let text = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const pageText = content.items.map((item: any) => item.str).join(" ");
                text += pageText + "\n";
            }

            setPdfContent(text); // Store the extracted content
            setUploadedFile({ name: file.name, status: "Uploaded" });

            // Paste the extracted content into the input box
            setInput(`Here is the content of the uploaded PDF:\n\n${text}`);

            // Optionally focus the input box
            if (inputRef.current) {
                inputRef.current.textContent = `Here is the content of the uploaded PDF:\n\n${text}`;
                inputRef.current.focus();
            }
        } catch (error) {
            console.error("Error extracting PDF content:", error);
            setUploadedFile({ name: file.name, status: "Error uploading file" });
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: "user",
            content: input.trim(),
        };

        setInput("");
        setIsLoading(true);
        setConversation((prev) => [...prev, userMessage]);
        setHasStartedChat(true);

        try {
            const question = input.trim();
            const context = pdfContent; // Use the extracted PDF content as context

            const { newMessage } = await chat([
                ...conversation,
                { role: "user", content: `Context: ${context}\n\nQuestion: ${question}` },
            ]);

            let textContent = "";

            const assistantMessage: Message = {
                role: "assistant",
                content: "",
            };

            setConversation((prev) => [...prev, assistantMessage]);

            for await (const delta of readStreamableValue(newMessage)) {
                textContent += delta;
                setConversation((prev) => {
                    const newConv = [...prev];
                    newConv[newConv.length - 1] = {
                        role: "assistant",
                        content: textContent,
                    };
                    return newConv;
                });
            }
        } catch (error) {
            console.error("Error: ", error);
            setConversation((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, there was an error. Please try again",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative h-full flex flex-col items-center">
            {/* Message Container */}
            <div className="flex-1 w-full max-w-3xl px-4">
                {!hasStartedChat ? (
                    <div className="flex flex-col justify-end h-full space-y-8">
                        <div className="text-center space-y-4">
                            <h1 className="text-4xl font-semibold">Hi there 👋</h1>
                            <h2 className="text-xl text-muted-foreground">
                                What can I help you with?
                            </h2>
                        </div>
                    </div>
                ) : (
                    <motion.div
                        animate={{
                            paddingBottom: input
                                ? input.split("\n").length > 3
                                    ? "206px"
                                    : "110px"
                                : "80px",
                        }}
                        transition={{ duration: 0.2 }}
                        className="pt-8 space-y-4"
                    >
                        {conversation.map((message, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn("flex", {
                                    "justify-end": message.role === "user",
                                    "justify-start": message.role === "assistant",
                                })}
                            >
                                <div
                                    className={cn(
                                        "max-w-[80%] rounded-xl px-4 py-2",
                                        {
                                            "bg-foreground text-background":
                                                message.role === "user",
                                            "bg-muted":
                                                message.role === "assistant",
                                        }
                                    )}
                                >
                                    {message.role === "assistant" ? (
                                        <MarkdownRenderer
                                            content={message.content}
                                        />
                                    ) : (
                                        <p className="whitespace-pre-wrap">
                                            {message.content}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messageEndRef} />
                    </motion.div>
                )}
            </div>

            {/* File Upload Tab */}
            {uploadedFile && (
                <div className="w-full max-w-3xl px-4 mb-2">
                    <div className="flex items-center justify-between p-2 border rounded-lg bg-muted">
                        <span className="text-sm font-medium">
                            {uploadedFile.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {uploadedFile.status}
                        </span>
                    </div>
                </div>
            )}

            {/* Input Container */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                    opacity: 1,
                    y: 0,
                    position: hasStartedChat ? "fixed" : "relative",
                }}
                className="w-full bg-gradient-to-t from-white via-white to-transparent pb-4 pt-6 bottom-0 mt-auto"
            >
                <div className="max-w-3xl mx-auto px-4">
                    <motion.div
                        animate={{ height: "auto" }}
                        whileFocus={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                        className="relative border rounded-2xl lg:rounded-e-3xl p-2.5 flex items-end gap-2 bg-background"
                    >
                        <div
                            contentEditable
                            role="textbox"
                            onInput={(e) => {
                                setInput(e.currentTarget.textContent || "");
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            data-placeholder="Message..."
                            className="flex-1 min-h-[36px] overflow-y-auto px-3 py-2 focus:outline-none text-sm bg-background rounded-md empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] whitespace-pre-wrap break-words"
                            ref={(element) => {
                                inputRef.current = element;
                                if (element && !input) {
                                    element.textContent = "";
                                }
                            }}
                        />

                        {/* File Upload Button */}
                        <Button
                            size="icon"
                            className="rounded-full shrink-0 mb-0.5 relative"
                            asChild
                        >
                            <label>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            handleFileUpload(file);
                                        }
                                    }}
                                />
                                <FileTextIcon
                                    strokeWidth={2.5}
                                    className="size-5"
                                />
                            </label>
                        </Button>

                        {/* Send Button */}
                        <Button
                            size="icon"
                            className="rounded-full shrink-0 mb-0.5"
                            onClick={handleSend}
                        >
                            <ArrowUpIcon strokeWidth={2.5} className="size-5" />
                        </Button>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default Chatbot;
