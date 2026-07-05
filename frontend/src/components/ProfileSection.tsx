"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Edit3,
  Save,
  X,
  Camera,
  Building2,
  Briefcase,
  FileText,
  BarChart3,
  Layers,
  Shield,
  Mail,
  Hash,
  CheckCircle2,
  Loader2,
  Key,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, saveUserProfile, UserProfile } from "@/lib/firestore";

interface ProfileSectionProps {
  onSaveComplete?: (updatedProfile: Partial<UserProfile>) => void;
}

export default function ProfileSection({ onSaveComplete }: ProfileSectionProps) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Partial<UserProfile>>({});
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load profile from Firestore
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    getUserProfile(user.uid).then((p) => {
      const data = p || {};
      setProfile(data);
      setDraft(data);
      setAvatarPreview(data.avatarDataUrl || null);
      setLoading(false);
    });
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatarPreview(dataUrl);
      setDraft((d) => ({ ...d, avatarDataUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const ok = await saveUserProfile(user.uid, draft);
    if (ok) {
      setProfile(draft);
      setEditing(false);
      setSaved(true);
      if (onSaveComplete) {
        onSaveComplete(draft);
      }
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setAvatarPreview(profile.avatarDataUrl || null);
    setEditing(false);
  };

  if (!user) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-4 text-center px-8"
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: "rgba(217,107,67,0.1)" }}
        >
          <User size={36} style={{ color: "#D96B43" }} />
        </div>
        <h2 className="text-2xl font-black" style={{ color: "#2C2523", fontFamily: "'Figtree', sans-serif" }}>
          Sign in to view profile
        </h2>
        <p className="text-sm" style={{ color: "rgba(0,0,0,0.45)" }}>
          Create an account or sign in to access your profile, save analysis history, and more.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-3">
        <Loader2 size={18} className="animate-spin" style={{ color: "#D96B43" }} />
        <span className="text-sm" style={{ color: "rgba(0,0,0,0.45)" }}>Loading profile...</span>
      </div>
    );
  }

  const initials = (draft.displayName || user.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const inputStyle = (editable: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    border: editable && editing ? "1.5px solid #D96B43" : "1.5px solid #E5DFD7",
    background: editable && editing ? "white" : "rgba(255,255,255,0.5)",
    fontSize: "13px",
    color: "#2C2523",
    fontFamily: "inherit",
    outline: "none",
    transition: "border 0.15s",
    cursor: editable && editing ? "text" : "default",
  });

  return (
    <div className="h-full overflow-y-auto" style={{ padding: "0" }}>
      {/* Cover band */}
      <div
        style={{
          height: "80px",
          background: "linear-gradient(135deg, #D96B43 0%, #764BA2 100%)",
          flexShrink: 0,
        }}
      />

      <div style={{ padding: "0 24px 32px" }}>
        {/* Avatar row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: "-44px",
            marginBottom: "20px",
          }}
        >
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: "84px",
                height: "84px",
                borderRadius: "50%",
                background: avatarPreview
                  ? "transparent"
                  : "linear-gradient(135deg,#D96B43,#764BA2)",
                border: "3px solid #FAF8F5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              }}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ color: "white", fontSize: "28px", fontWeight: 800 }}>
                  {initials}
                </span>
              )}
            </div>
            {editing && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    position: "absolute",
                    bottom: "2px",
                    right: "2px",
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "#D96B43",
                    border: "2px solid white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Camera size={11} color="white" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </div>

          {/* Edit / Save buttons */}
          <div style={{ display: "flex", gap: "8px", paddingBottom: "4px" }}>
            {editing ? (
              <>
                <button
                  onClick={handleCancel}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "20px",
                    border: "1.5px solid #E5DFD7",
                    background: "white",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "rgba(0,0,0,0.5)",
                    cursor: "pointer",
                  }}
                >
                  <X size={12} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: "none",
                    background: "#D96B43",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "white",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? (
                    <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Save size={12} />
                  )}
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: "1.5px solid #E5DFD7",
                  background: "white",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#2C2523",
                  cursor: "pointer",
                }}
              >
                <Edit3 size={12} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Saved toast */}
        {saved && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "12px",
              background: "rgba(92,200,181,0.12)",
              border: "1px solid rgba(92,200,181,0.3)",
              marginBottom: "16px",
            }}
          >
            <CheckCircle2 size={14} style={{ color: "#5CC8B5" }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#2C2523" }}>
              Profile saved!
            </span>
          </div>
        )}

        {/* Name */}
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#2C2523",
            fontFamily: "'Figtree', sans-serif",
            margin: "0 0 2px",
          }}
        >
          {draft.displayName || user.displayName || "Your Name"}
        </h2>
        <p style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)", marginBottom: "20px" }}>
          {draft.role || "Data Analyst"} {draft.company ? `• ${draft.company}` : ""}
        </p>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          {[
            { icon: BarChart3, label: "Analyses Run", value: profile.analysesRun ?? 0, color: "#D96B43" },
            { icon: Layers, label: "Decks Created", value: profile.decksCreated ?? 0, color: "#764BA2" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              style={{
                padding: "14px",
                borderRadius: "16px",
                background: "white",
                border: "1.5px solid #E5DFD7",
                textAlign: "center",
              }}
            >
              <Icon size={18} style={{ color, margin: "0 auto 6px" }} />
              <p style={{ fontSize: "22px", fontWeight: 800, color: "#2C2523", margin: 0 }}>
                {value}
              </p>
              <p style={{ fontSize: "10px", color: "rgba(0,0,0,0.4)", margin: "2px 0 0", fontWeight: 600 }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Display Name */}
          <FieldRow icon={User} label="Display Name">
            <input
              style={inputStyle(true)}
              value={draft.displayName || ""}
              disabled={!editing}
              placeholder="Your full name"
              onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
            />
          </FieldRow>

          {/* Email (readonly) */}
          <FieldRow icon={Mail} label="Email">
            <input
              style={inputStyle(false)}
              value={user.email || ""}
              disabled
              readOnly
            />
          </FieldRow>

          {/* Bio */}
          <FieldRow icon={FileText} label="Bio">
            <textarea
              style={{
                ...inputStyle(true),
                height: "72px",
                resize: "none",
                lineHeight: "1.5",
              }}
              value={draft.bio || ""}
              disabled={!editing}
              placeholder="Tell us a bit about yourself..."
              onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
            />
          </FieldRow>

          {/* Company */}
          <FieldRow icon={Building2} label="Company">
            <input
              style={inputStyle(true)}
              value={draft.company || ""}
              disabled={!editing}
              placeholder="Your company or organization"
              onChange={(e) => setDraft((d) => ({ ...d, company: e.target.value }))}
            />
          </FieldRow>

          {/* Role */}
          <FieldRow icon={Briefcase} label="Role">
            <input
              style={inputStyle(true)}
              value={draft.role || ""}
              disabled={!editing}
              placeholder="Your job title"
              onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
            />
          </FieldRow>

          {/* UID (readonly) */}
          <FieldRow icon={Hash} label="User ID">
            <input
              style={{ ...inputStyle(false), fontFamily: "monospace", fontSize: "11px" }}
              value={user.uid.slice(0, 20) + "..."}
              disabled
              readOnly
            />
          </FieldRow>
        </div>

        {/* Danger zone */}
        <div
          style={{
            marginTop: "28px",
            padding: "16px",
            borderRadius: "16px",
            border: "1.5px solid rgba(239,68,68,0.2)",
            background: "rgba(239,68,68,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <AlertTriangle size={14} style={{ color: "#ef4444" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Danger Zone
            </span>
          </div>
          <button
            onClick={() => { if (confirm("Sign out of your account?")) logout(); }}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              background: "#ef4444",
              color: "white",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}

function FieldRow({
  icon: Icon,
  label,
  children,
}: {
  icon: any;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "5px",
        }}
      >
        <Icon size={11} style={{ color: "rgba(0,0,0,0.4)" }} />
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "rgba(0,0,0,0.4)",
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
