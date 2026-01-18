"use client";
import Link from "next/link";
import React, { useState } from "react";
import { auth } from "@/lib/firebase";

interface TeamDiscussionsProps {
  project?: any;
}

const TeamDiscussions = ({ project }: TeamDiscussionsProps) => {
  const [newDiscussion, setNewDiscussion] = useState({
    title: "",
    content: "",
  });
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const discussions = project?.discussions || [];

  const handleAddDiscussion = async () => {
    if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) return;

    setAdding(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const response = await fetch(`/api/projects/${project.id}/discussions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(newDiscussion),
      });

      const result = await response.json();
      if (result.success) {
        alert("Discussion added successfully!");
        setNewDiscussion({ title: "", content: "" });
        setShowForm(false);
        // Refresh project data
        window.location.reload();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error adding discussion:", error);
      alert("Failed to add discussion");
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12">
          <div className="card__wrapper">
            <div className="card__title-wrap mb-25 flex justify-between items-center">
              <h5 className="card__heading-title">Team Discussions</h5>
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn btn-primary btn-sm"
              >
                {showForm ? "Cancel" : "Add Discussion"}
              </button>
            </div>
            <div className="card__body">
              {showForm && (
                <div className="mb-4 p-4 border rounded">
                  <input
                    type="text"
                    placeholder="Discussion Title"
                    value={newDiscussion.title}
                    onChange={(e) =>
                      setNewDiscussion({
                        ...newDiscussion,
                        title: e.target.value,
                      })
                    }
                    className="form-control mb-2"
                  />
                  <textarea
                    placeholder="Discussion Content"
                    value={newDiscussion.content}
                    onChange={(e) =>
                      setNewDiscussion({
                        ...newDiscussion,
                        content: e.target.value,
                      })
                    }
                    className="form-control mb-2"
                    rows={3}
                  />
                  <button
                    onClick={handleAddDiscussion}
                    disabled={adding}
                    className="btn btn-primary"
                  >
                    {adding ? "Adding..." : "Add Discussion"}
                  </button>
                </div>
              )}

              <div className="discussions__list">
                {discussions.length > 0 ? (
                  discussions.map((discussion: any) => (
                    <div key={discussion.id} className="discussion__item">
                      <h6>{discussion.title}</h6>
                      <p>
                        {discussion.content}{" "}
                        <span className="text-sm text-gray-500">
                          - {discussion.authorName} on{" "}
                          {new Date(discussion.createdAt).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">
                    No discussions yet. Start the conversation!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeamDiscussions;
