import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Stethoscope, Lock, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { MediKioskLogo } from "../../components/common/MediKioskLogo";
import { useDoctor } from "../../context/DoctorContext";
import { apiService } from "../../services/apiService";

export function DoctorAuthPage() {
  const navigate = useNavigate();
  const { loginDoctor } = useDoctor();

  const [email, setEmail] = useState("dr.arun@medikiosk.in");
  const [password, setPassword] = useState("doctor123");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const demoAccounts = [
    { name: "Dr. Arun Sharma", email: "dr.arun@medikiosk.in", dept: "General Medicine", role: "Sr. Consultant" },
    { name: "Dr. K. S. Murthy", email: "dr.murthy@medikiosk.in", dept: "Cardiology", role: "Cardiologist" },
    { name: "Dr. Priya Nair", email: "dr.priya@medikiosk.in", dept: "Pediatrics", role: "Pediatrician" },
    { name: "Dr. Rajesh Vaidya", email: "dr.rajesh@medikiosk.in", dept: "AYUSH / Ayurveda", role: "Ayurveda Chikitsa" },
  ];

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await apiService.loginDoctor({ email, password });
      if (result.success && result.doctor) {
        loginDoctor(result.doctor);
        navigate("/doctor/queue");
      } else {
        setErrorMessage(result.error || "Invalid doctor email or password. Please verify credentials.");
      }
    } catch (err) {
      setErrorMessage("Cannot connect to authentication service. Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (acc) => {
    setEmail(acc.email);
    setPassword("doctor123");
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-mediblue-100">
      {/* Top Brand Link */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link to="/">
          <MediKioskLogo size="default" light={true} />
        </Link>
        <Link
          to="/patient/identify"
          className="text-xs text-slate-400 hover:text-white font-medium transition"
        >
          ← Return to Patient Intake
        </Link>
      </div>

      {/* Login Card */}
      <div className="max-w-md mx-auto w-full my-8">
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 backdrop-blur-md">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-mediblue-600/20 text-mediblue-400 border border-mediblue-500/30 mx-auto flex items-center justify-center">
              <Stethoscope className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Physician Portal Login</h1>
            <p className="text-xs text-slate-400">
              Authenticated access to structured clinical intakes, OCR lab extracts, and live OPD triage queues.
            </p>
          </div>

          {/* Quick Demo Switcher */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-mediblue-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-mediblue-400" />
              <span>Hackathon Demo Physician Accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => selectDemoAccount(acc)}
                  className={`text-left p-2 rounded-xl text-xs transition border ${
                    email === acc.email
                      ? "bg-mediblue-600/20 border-mediblue-500 text-white"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <p className="font-semibold text-[11px] truncate text-slate-200">{acc.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{acc.dept}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Doctor Hospital Email / ID:</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dr.arun@medikiosk.in"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-mediblue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-mediblue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-mediblue-600 hover:bg-mediblue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Authenticating with Database...</span>
              ) : (
                <>
                  <span>Secure Physician Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 space-y-1">
        <p>MediKiosk Clinical Workspace • Authenticated via FastAPI & JWT Database Tokens</p>
      </div>
    </div>
  );
}
