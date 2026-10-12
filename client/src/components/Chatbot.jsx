// Chatbot.jsx - floating "FixMate Assistant" button + chat window (bottom-right of every page).
// It keeps the conversation in React state and sends it to POST /api/chatbot.
// The Groq key is never in the browser: Express adds it on the server.
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from './Icon';
import { chatbotApi, getErrorMessage } from '../services/api';

const GREETING = { role: 'assistant', content: 'Hi! I am the FixMate Assistant. Ask me about our repair services, prices or how to book.' };
const SUGGESTIONS = ['How do I book a service?', 'What services do you offer?', 'How can I cancel a booking?'];

export default function Chatbot() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Keep the newest message in view, and focus the box when the window opens.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, loading, open]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Not shown on the login/register screens, which have their own full-page design.
  if (pathname === '/login' || pathname === '/register') return null;

  const send = async (content) => {
    const clean = content.trim();
    if (!clean || loading) return;
    const next = [...messages, { role: 'user', content: clean }];
    setMessages(next);
    setText('');
    setError('');
    setLoading(true);
    try {
      // The greeting is only for display, so it is not sent to the server.
      const { reply } = await chatbotApi.send(next.filter((m) => m !== GREETING));
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    send(text);
  };

  return (
    <div className="chatbot">
      {open && (
        <section className="chatbot__window" role="dialog" aria-label="FixMate Assistant">
          <header className="chatbot__head">
            <div>
              <strong>FixMate Assistant</strong>
              <span>Ask about services &amp; booking</span>
            </div>
            <button type="button" className="chatbot__close" onClick={() => setOpen(false)} aria-label="Close chat">
              <Icon name="x" size={18} />
            </button>
          </header>

          <div className="chatbot__body" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`chatbot__msg chatbot__msg--${m.role}`}>{m.content}</div>
            ))}
            {messages.length === 1 && !loading && (
              <div className="chatbot__chips">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
            {loading && <div className="chatbot__msg chatbot__msg--assistant chatbot__typing" aria-label="Assistant is typing"><i /><i /><i /></div>}
            {error && <div className="chatbot__error" role="alert">{error}</div>}
            <div ref={bottomRef} />
          </div>

          <form className="chatbot__form" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your question..."
              maxLength={500}
              aria-label="Your message"
            />
            <button type="submit" disabled={loading || !text.trim()} aria-label="Send message">
              <Icon name="send" size={18} />
            </button>
          </form>
        </section>
      )}

      <button type="button" className="chatbot__fab" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close chat' : 'Open chat assistant'} aria-expanded={open}>
        <Icon name={open ? 'x' : 'message'} size={26} />
      </button>
    </div>
  );
}
