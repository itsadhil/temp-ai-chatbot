import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

type MarkdownRendererProps = {
    content: string;
    className?: string;
};

const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
    return (
        <div className={cn("prose dark:prose-invert max-w-none", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <h1 className="text-xl font-bold mb-4 mt-6 first:mt-0">
                            {children}
                        </h1>
                    ),
                    p: ({ children }) => (
                        <p className="mb-3 last:mb-0 leading-normal">
                            {children}
                        </p>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;