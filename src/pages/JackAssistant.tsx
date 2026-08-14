import { useMemo, useRef, useState } from "react";
import { Mic, MicOff, Calendar, HelpCircle, Bell, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type Intent = "schedule" | "question" | "reminder" | "general";

const ACTIVATION_PHRASE = "jack jack jack";
const AGENT_NAME = "Jack";
const ORGANIZATION_NAME = "Just Answers & Kind Solutions";

const summarizeIntent = (text: string): Intent => {
  const lower = text.toLowerCase();
  if (/(calendar|appointment|schedule|doctor|meeting)/.test(lower)) return "schedule";
  if (/(remind|remember|medication|medicine|alert)/.test(lower)) return "reminder";
  if (/(what|who|when|where|why|how|question)/.test(lower)) return "question";
  return "general";
};

const buildPreview = (request: string, intent: Intent) => {
  const goalByIntent: Record<Intent, string> = {
    schedule: "Review your schedule request, suggest a clear plan, and list next steps.",
    reminder: "Set up a reminder-style response with timing suggestions and safety checks.",
    question: "Provide a simple answer first, then offer deeper details if you want them.",
    general: "Give a friendly action plan with plain-language steps.",
  };

  return {
    repeat: `You asked: \"${request}\"`,
    output: goalByIntent[intent],
  };
};

const speak = (text: string) => {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

const JackAssistant = () => {
  const [manualInput, setManualInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [capturedRequest, setCapturedRequest] = useState("");
  const [previewAccepted, setPreviewAccepted] = useState<boolean | null>(null);
  const [status, setStatus] = useState("Say \"Jack, Jack, Jack\" to begin.");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const intent = useMemo(() => summarizeIntent(capturedRequest), [capturedRequest]);
  const preview = useMemo(() => buildPreview(capturedRequest, intent), [capturedRequest, intent]);

  const runWorkflow = (rawText: string) => {
    const cleaned = rawText.trim();
    if (!cleaned) return;

    const lower = cleaned.toLowerCase();
    if (!isActivated && lower.includes(ACTIVATION_PHRASE)) {
      setIsActivated(true);
      setStatus("I heard the wake phrase. Please tell me what you need help with.");
      speak("Hi, I am Jack. Please tell me what you need.");
      return;
    }

    if (/(forget it|cancel|never mind)/i.test(cleaned)) {
      setCapturedRequest("");
      setPreviewAccepted(null);
      setStatus("No problem. Request canceled.");
      speak("No problem. I canceled that.");
      return;
    }

    if (isActivated) {
      if (/^no\b/i.test(cleaned)) {
        setPreviewAccepted(false);
        setStatus("Okay, please say it again and I will revise it.");
        speak("Okay, please tell me the corrected request.");
        return;
      }

      if (/^yes\b/i.test(cleaned) && capturedRequest) {
        setPreviewAccepted(true);
        setStatus("Great. Executing your request in simple mode.");
        speak("Great. Here is the simple answer first, and I can go deeper if you want.");
        return;
      }

      setCapturedRequest(cleaned);
      setPreviewAccepted(null);
      setStatus("I repeated your request and prepared the expected output. Is this correct?");
      speak("I heard your request. Is this correct?");
      return;
    }

    setStatus("Please start with Jack, Jack, Jack to wake me up.");
  };

  const startListening = () => {
    const RecognitionCtor = (window as Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      || (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!RecognitionCtor) {
      setStatus("Voice input is not available in this browser. You can type below.");
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const latest = event.results[event.results.length - 1]?.[0]?.transcript ?? "";
      runWorkflow(latest);
    };

    recognition.onerror = (event) => {
      setStatus(`Voice error: ${event.error}. You can still type below.`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    setStatus("Listening... say Jack, Jack, Jack to activate.");
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setStatus("Microphone stopped. You can start again anytime.");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="border-sky-200 shadow-lg">
          <CardHeader>
            <Badge className="w-fit bg-sky-600">Voice Companion</Badge>
            <CardTitle className="text-3xl text-slate-800">{AGENT_NAME} • {ORGANIZATION_NAME}</CardTitle>
            <p className="text-lg text-slate-600">A calm, senior-friendly assistant for questions, schedule help, and reminders.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-sky-100 p-4 text-lg text-slate-700">
              <strong>Wake phrase:</strong> “Hey Jack” or “Jack, Jack, Jack”
            </div>
            <div className="flex flex-wrap gap-3">
              {!isListening ? (
                <Button size="lg" className="text-lg" onClick={startListening}><Mic className="mr-2 h-5 w-5" />Start Listening</Button>
              ) : (
                <Button size="lg" variant="destructive" className="text-lg" onClick={stopListening}><MicOff className="mr-2 h-5 w-5" />Stop</Button>
              )}
            </div>
            <p className="text-lg text-slate-700">{status}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Type Instead of Speaking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              className="h-14 text-lg"
              placeholder='Example: Jack Jack Jack ... Remind me about my doctor at 3 PM'
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
            />
            <Button size="lg" onClick={() => { runWorkflow(manualInput); setManualInput(""); }}>Send</Button>
          </CardContent>
        </Card>

        {capturedRequest && (
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="text-2xl">Confirmation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-lg">
              <p><CheckCircle2 className="inline mr-2 h-5 w-5 text-emerald-600" />{preview.repeat}</p>
              <p><HelpCircle className="inline mr-2 h-5 w-5 text-sky-700" />Expected output: {preview.output}</p>
              <p>Please say or type: <strong>Yes</strong>, <strong>No</strong>, or <strong>Forget it</strong>.</p>
            </CardContent>
          </Card>
        )}

        {previewAccepted && (
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="pt-6 text-lg text-slate-700">
              <p className="mb-2">Simple Overview:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li><Calendar className="mr-2 inline h-5 w-5" />I understood your main request.</li>
                <li><Bell className="mr-2 inline h-5 w-5" />I can help break it into clear steps.</li>
                <li>I can now provide deeper details if you ask for more information.</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
};

export default JackAssistant;
