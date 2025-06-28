import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userAPI } from "../lib/api";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    skills: [] as string[],
  });
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.profile.name || "",
        bio: user.profile.bio || "",
        skills: user.profile.skills || [],
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("bio", formData.bio);

      if (user?.role === "mentor") {
        data.append("skills", JSON.stringify(formData.skills));
      }

      if (image) {
        data.append("image", image);
      }

      const response = await userAPI.updateProfile(data);
      updateUser(response.data);
      setMessage("프로필이 업데이트되었습니다.");
      setImage(null);
    } catch (error: any) {
      setMessage(
        error.response?.data?.error || "프로필 업데이트에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const skillsText = e.target.value;
    const skillsArray = skillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill);
    setFormData((prev) => ({ ...prev, skills: skillsArray }));
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">프로필 관리</h1>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div
              className={`px-4 py-3 rounded ${
                message.includes("성공") || message.includes("업데이트")
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="flex items-center space-x-6">
            <div className="shrink-0">
              <img
                id="profile-photo"
                className="h-32 w-32 object-cover rounded-full"
                src={user.profile.imageUrl}
                alt="프로필 이미지"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="profile"
                className="block text-sm font-medium text-gray-700"
              >
                프로필 이미지 (.jpg, .png, 최대 1MB)
              </label>
              <input
                id="profile"
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              이름
            </label>
            <input
              id="name"
              type="text"
              className="input mt-1"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700"
            >
              소개
            </label>
            <textarea
              id="bio"
              rows={4}
              className="textarea mt-1"
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              disabled={loading}
            />
          </div>

          {user.role === "mentor" && (
            <div>
              <label
                htmlFor="skillsets"
                className="block text-sm font-medium text-gray-700"
              >
                기술 스택 (쉼표로 구분)
              </label>
              <textarea
                id="skillsets"
                rows={3}
                placeholder="React, Node.js, TypeScript"
                className="textarea mt-1"
                value={formData.skills.join(", ")}
                onChange={handleSkillsChange}
                disabled={loading}
              />
            </div>
          )}

          <div>
            <button
              id="save"
              type="submit"
              disabled={loading}
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
