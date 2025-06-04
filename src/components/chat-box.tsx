"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, FileTextIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { chat } from "@/actions/chat";
import { readStreamableValue } from "ai/rsc";
import { cn } from "@/lib/utils";
import MarkdownRenderer from "./markdown-renderer";
import * as pdfjsLib from "pdfjs-dist";
import { Card, CardContent } from "@/components/ui/card";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

export type Message = {
    role: "user" | "assistant";
    content: string;
    fileHeader?: { name: string }; // Optional file header for messages
};

const predefinedQuestions = [
    "What is the status of my project?",
    "Can you summarize this document?",
    "What are the next steps?",
];

const Chatbot = () => {
    const messageEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);

    const [input, setInput] = useState<string>("");
    const [conversation, setConversation] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [uploadedFile, setUploadedFile] = useState<{ name: string; status: string } | null>(null);
    const [pdfTemp, setPdfTemp] = useState<string>(""); // Temporary variable for PDF content
    const [userTemp, setUserTemp] = useState<string>(""); // Temporary variable for user input
    const [showFileHeader, setShowFileHeader] = useState<boolean>(false); // Track whether to show file header
    const [hasStartedChat, setHasStartedChat] = useState<boolean>(false); // Track if chat has started

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation]);

    const extractTextFromPDF = async (file: File): Promise<string> => {
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
            // Extract text from the PDF
            const text = await extractTextFromPDF(file);

            // 1. Chunk the text
            const chunks = chunkText(text, 500);

            // 2. Upsert chunks to Weaviate via API
            const res = await fetch("/api/upsert-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chunks }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            setPdfTemp(text); // Store the extracted content in the PDF temp variable
            setUploadedFile({ name: file.name, status: "Uploaded" });
            setShowFileHeader(true); // Enable file header for the next user response
        } catch (error) {
            console.error("Error extracting PDF content:", error);
            setUploadedFile({ name: file.name, status: "Error uploading file" });
        }
    };

    const handleSend = async () => {
        if (isLoading) return;

        setIsLoading(true);

        try {
            let contentToSend = "";

            // Determine whether to use PDF content or user input
            if (pdfTemp) {
                contentToSend = pdfTemp;
                if (input.trim()) {
                    contentToSend += `\n\nQuestion: ${input.trim()}`;
                }
            } else if (input.trim()) {
                contentToSend = input.trim();
            }

            // Update the userTemp variable with the latest input
            setUserTemp(input.trim());

            // Add the user's question (if any) to the conversation
            const userMessage: Message = {
                role: "user",
                content: input.trim() || "Using the uploaded file...",
                fileHeader: showFileHeader ? { name: uploadedFile?.name || "" } : undefined, // Add file header if applicable
            };
            setConversation((prev) => [...prev, userMessage]);

            // Reset file header after the user's response
            setShowFileHeader(false);

            // Add a placeholder message to indicate the AI is processing only if a file is uploaded
            if (pdfTemp) {
                const assistantMessage: Message = {
                    role: "assistant",
                    content: "Processing the uploaded file...",
                    fileHeader: { name: uploadedFile?.name || "" }, // Add file header for AI response
                };
                setConversation((prev) => [...prev, assistantMessage]);
            }

            // Send the content to the AI backend
            const { newMessage } = await chat([
                ...conversation,
                { role: "user", content: contentToSend },
            ]);

            let textContent = "";

            // Update the assistant's message with the AI's response
            for await (const delta of readStreamableValue(newMessage)) {
                textContent += delta;
                setConversation((prev) => {
                    const newConv = [...prev];
                    // Update the last assistant message with the AI's response
                    if (newConv[newConv.length - 1]?.role === "assistant") {
                        newConv[newConv.length - 1] = {
                            ...newConv[newConv.length - 1],
                            content: textContent,
                        };
                    } else {
                        // If no placeholder assistant message exists, append a new one
                        newConv.push({
                            role: "assistant",
                            content: textContent,
                            fileHeader: pdfTemp ? { name: uploadedFile?.name || "" } : undefined,
                        });
                    }
                    return newConv;
                });
            }

            // Clear the PDF temp variable after processing
            if (pdfTemp) {
                setPdfTemp(""); // Reset the PDF temp variable
                setUploadedFile(null); // Clear the uploaded file state
            }
        } catch (error) {
            console.error("Error sending content to AI:", error);
            setConversation((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, there was an error processing the file. Please try again.",
                },
            ]);
        } finally {
            setInput(""); // Clear the input field
            setIsLoading(false);
        }
    };

    function chunkText(text: string, chunkSize = 500): string[] {
        const chunks = [];
        let i = 0;
        while (i < text.length) {
            chunks.push(text.slice(i, i + chunkSize));
            i += chunkSize;
        }
        return chunks;
    }

    return (
        <div className="relative h-full flex flex-col items-center">
            {/* Message Container */}
            <div className="flex-1 w-full max-w-3xl px-4">
                {!hasStartedChat ? (
                    <div className="flex flex-col justify-end h-full space-y-8">
                        <div className="text-center space-y-4">
                            <h1 className="text-4xl font-semibold">Welcome Back! 👋</h1>
                            <h2 className="text-xl text-muted-foreground">
                                How can I assist you today?
                            </h2>
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center">
                            {predefinedQuestions.map((question, idx) => (
                                <Card
                                    key={idx}
                                    className="cursor-pointer w-72 hover:shadow-lg transition"
                                    onClick={() => {
                                        setInput(question);
                                        if (inputRef.current) {
                                            inputRef.current.textContent = question;
                                            inputRef.current.focus();
                                        }
                                    }}
                                >
                                    <CardContent className="p-4 text-center font-medium">
                                        {question}
                                    </CardContent>
                                </Card>
                            ))}
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
                                    {/* File Header for Messages */}
                                    {message.fileHeader && (
                                        <div className="flex items-center mb-2">
                                            <FileTextIcon className="size-5 text-blue-500 mr-2" />
                                            <span className="text-sm font-medium">
                                                {message.fileHeader.name}
                                            </span>
                                        </div>
                                    )}
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
                }}
                className="w-full pb-4 pt-6 bottom-0 mt-auto bg-transparent"
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
                                    setHasStartedChat(true); // Mark chat as started
                                }
                            }}
                            data-placeholder="Ask a question or press Enter to process the file..."
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
                                            setHasStartedChat(true); // Mark chat as started
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
                            onClick={() => {
                                handleSend();
                                setHasStartedChat(true); // Mark chat as started
                            }}
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
