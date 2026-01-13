"use client";

import { useEffect, useState } from "react";
import { MarketingServiceGuard } from "@/components/marketing-service/MarketingServiceGuard";
import { PermissionGuard } from "@/components/layout/PermissionGuard";
import { useToast } from "@/components/ui/Toast";
import {
  problemService,
  type MarketingProblem,
  type ProblemPayload,
} from "@/services/marketing-service/problemService";
import {
  competitorService,
  type MarketingCompetitor,
  type CompetitorPayload,
} from "@/services/marketing-service/competitorService";

type Problem = MarketingProblem;
type Competitor = MarketingCompetitor;

export default function SetupsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  const [newProblemName, setNewProblemName] = useState("");
  const [newCompetitorName, setNewCompetitorName] = useState("");

  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(
    null,
  );
  const [editProblemName, setEditProblemName] = useState("");
  const [editCompetitorName, setEditCompetitorName] = useState("");

  const [problemLoading, setProblemLoading] = useState(false);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const { showToast } = useToast();

  const loadProblems = async () => {
    setProblemLoading(true);
    try {
      const data = await problemService.listProblems();
      setProblems(data);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to load problems",
        "error",
      );
    } finally {
      setProblemLoading(false);
    }
  };

  const loadCompetitors = async () => {
    setCompetitorLoading(true);
    try {
      const data = await competitorService.listCompetitors();
      setCompetitors(data);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to load competitors",
        "error",
      );
    } finally {
      setCompetitorLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([loadProblems(), loadCompetitors()]);
  }, []);

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const handleAddProblem = async () => {
    const name = newProblemName.trim();
    if (!name) {
      showToast("Problem name is required", "error");
      return;
    }

    setProblemLoading(true);
    try {
      const payload: ProblemPayload = { name };
      const created = await problemService.createProblem(payload);
      setProblems((prev) => [created, ...prev]);
      setNewProblemName("");
      showToast("Problem created");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to create problem",
        "error",
      );
    } finally {
      setProblemLoading(false);
    }
  };

  const handleUpdateProblem = async () => {
    if (!editingProblem) return;
    const name = editProblemName.trim();
    if (!name) {
      showToast("Problem name is required", "error");
      return;
    }

    setProblemLoading(true);
    try {
      const payload: ProblemPayload = { name };
      const updated = await problemService.updateProblem(
        editingProblem.id,
        payload,
      );
      setProblems((prev) =>
        prev.map((problem) =>
          problem.id === updated.id ? updated : problem,
        ),
      );
      setEditingProblem(null);
      setEditProblemName("");
      showToast("Problem updated");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to update problem",
        "error",
      );
    } finally {
      setProblemLoading(false);
    }
  };

  const handleDeleteProblem = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this problem? This action cannot be undone.",
      )
    ) {
      return;
    }
    setProblemLoading(true);
    try {
      await problemService.deleteProblem(id);
      setProblems((prev) => prev.filter((problem) => problem.id !== id));
      showToast("Problem removed");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete problem",
        "error",
      );
    } finally {
      setProblemLoading(false);
    }
  };

  const handleAddCompetitor = async () => {
    const name = newCompetitorName.trim();
    if (!name) {
      showToast("Competitor name is required", "error");
      return;
    }

    setCompetitorLoading(true);
    try {
      const payload: CompetitorPayload = { name };
      const created = await competitorService.createCompetitor(payload);
      setCompetitors((prev) => [created, ...prev]);
      setNewCompetitorName("");
      showToast("Competitor created");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to create competitor",
        "error",
      );
    } finally {
      setCompetitorLoading(false);
    }
  };

  const handleUpdateCompetitor = async () => {
    if (!editingCompetitor) return;
    const name = editCompetitorName.trim();
    if (!name) {
      showToast("Competitor name is required", "error");
      return;
    }

    setCompetitorLoading(true);
    try {
      const payload: CompetitorPayload = { name };
      const updated = await competitorService.updateCompetitor(
        editingCompetitor.id,
        payload,
      );
      setCompetitors((prev) =>
        prev.map((competitor) =>
          competitor.id === updated.id ? updated : competitor,
        ),
      );
      setEditingCompetitor(null);
      setEditCompetitorName("");
      showToast("Competitor updated");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to update competitor",
        "error",
      );
    } finally {
      setCompetitorLoading(false);
    }
  };

  const handleDeleteCompetitor = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this competitor? This action cannot be undone.",
      )
    ) {
      return;
    }
    setCompetitorLoading(true);
    try {
      await competitorService.deleteCompetitor(id);
      setCompetitors((prev) => prev.filter((competitor) => competitor.id !== id));
      showToast("Competitor removed");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete competitor",
        "error",
      );
    } finally {
      setCompetitorLoading(false);
    }
  };

  return (
    <MarketingServiceGuard>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">
            Marketing · Setups
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Operations Setup
          </h1>
          <p className="text-sm text-slate-300">
            Manage marketing problems and competitor references from a single
            workspace.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
            <header className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Problems
              </p>
              <h2 className="text-xl font-semibold text-white">
                Marketing Problems
              </h2>
              <p className="text-sm text-slate-400">
                Track operational issues impacting marketing execution.
              </p>
            </header>

            <div className="mt-5 flex gap-4">
              <input
                type="text"
                value={newProblemName}
                onChange={(e) => setNewProblemName(e.target.value)}
                placeholder="Enter problem name…"
                className="flex-1 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-400 focus:border-amber-400/60 focus:outline-none"
                disabled={problemLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !problemLoading) {
                    void handleAddProblem();
                  }
                }}
              />
              <button
                onClick={handleAddProblem}
                disabled={problemLoading || !newProblemName.trim()}
                className="rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {problemLoading ? "Saving…" : "Add"}
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase text-slate-400">
                    <th className="px-3 py-2 text-left tracking-[0.2em]">ID</th>
                    <th className="px-3 py-2 text-left tracking-[0.2em]">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left tracking-[0.2em]">
                      Created
                    </th>
                    <th className="px-3 py-2 text-left tracking-[0.2em]">
                      Updated
                    </th>
                    <th className="px-3 py-2 text-left tracking-[0.2em]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {problems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center">
                        <p className="text-slate-500">
                          No problems yet—add the first entry above.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    problems.map((problem) => (
                      <tr key={problem.id} className="hover:bg-white/5">
                        <td className="px-3 py-3 text-slate-400">
                          #{problem.id}
                        </td>
                        <td className="px-3 py-3 text-white">
                          {editingProblem?.id === problem.id ? (
                            <input
                              value={editProblemName}
                              onChange={(e) => setEditProblemName(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !problemLoading) {
                                  void handleUpdateProblem();
                                } else if (e.key === "Escape") {
                                  setEditingProblem(null);
                                  setEditProblemName("");
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            problem.name
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-400">
                          {formatDate(problem.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-slate-400">
                          {formatDate(problem.updatedAt)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            {editingProblem?.id === problem.id ? (
                              <>
                                <button
                                  onClick={handleUpdateProblem}
                                  disabled={problemLoading}
                                  className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingProblem(null);
                                    setEditProblemName("");
                                  }}
                                  disabled={problemLoading}
                                  className="rounded-lg bg-slate-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingProblem(problem);
                                    setEditProblemName(problem.name);
                                  }}
                                  disabled={problemLoading}
                                  className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  Edit
                                </button>
                                <PermissionGuard
                                  permission="problem.delete"
                                  serviceContext="marketing-service"
                                  fallback={
                                    <button
                                      disabled
                                      className="rounded-lg bg-slate-600 px-3 py-1 text-xs font-semibold text-slate-400 cursor-not-allowed"
                                    >
                                      Delete
                                    </button>
                                  }
                                >
                                  <button
                                    onClick={() => void handleDeleteProblem(problem.id)}
                                    disabled={problemLoading}
                                    className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                </PermissionGuard>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
            <header className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Competitors
              </p>
              <h2 className="text-xl font-semibold text-white">
                Competitor Landscape
              </h2>
              <p className="text-sm text-slate-400">
                Keep track of active competitors for better market awareness.
              </p>
            </header>

            <div className="mt-5 flex gap-4">
              <input
                type="text"
                value={newCompetitorName}
                onChange={(e) => setNewCompetitorName(e.target.value)}
                placeholder="Enter competitor name…"
                className="flex-1 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-400 focus:border-fuchsia-400/60 focus:outline-none"
                disabled={competitorLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !competitorLoading) {
                    void handleAddCompetitor();
                  }
                }}
              />
              <button
                onClick={handleAddCompetitor}
                disabled={competitorLoading || !newCompetitorName.trim()}
                className="rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {competitorLoading ? "Saving…" : "Add"}
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase text-slate-400">
                    <th className="px-3 py-2 text-left tracking-[0.2em]">ID</th>
                    <th className="px-3 py-2 text-left tracking-[0.2em]">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left tracking-[0.2em]">
                      Created
                    </th>
                    <th className="px-3 py-2 text-left tracking-[0.2em]">
                      Updated
                    </th>
                    <th className="px-3 py-2 text-left tracking-[0.2em]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {competitors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center">
                        <p className="text-slate-500">
                          No competitors yet—add the first entry above.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    competitors.map((competitor) => (
                      <tr key={competitor.id} className="hover:bg-white/5">
                        <td className="px-3 py-3 text-slate-400">
                          #{competitor.id}
                        </td>
                        <td className="px-3 py-3 text-white">
                          {editingCompetitor?.id === competitor.id ? (
                            <input
                              value={editCompetitorName}
                              onChange={(e) => setEditCompetitorName(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-fuchsia-400/60 focus:outline-none"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !competitorLoading) {
                                  void handleUpdateCompetitor();
                                } else if (e.key === "Escape") {
                                  setEditingCompetitor(null);
                                  setEditCompetitorName("");
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            competitor.name
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-400">
                          {formatDate(competitor.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-slate-400">
                          {formatDate(competitor.updatedAt)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            {editingCompetitor?.id === competitor.id ? (
                              <>
                                <button
                                  onClick={handleUpdateCompetitor}
                                  disabled={competitorLoading}
                                  className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCompetitor(null);
                                    setEditCompetitorName("");
                                  }}
                                  disabled={competitorLoading}
                                  className="rounded-lg bg-slate-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingCompetitor(competitor);
                                    setEditCompetitorName(competitor.name);
                                  }}
                                  disabled={competitorLoading}
                                  className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  Edit
                                </button>
                                <PermissionGuard
                                  permission="competitor.delete"
                                  serviceContext="marketing-service"
                                  fallback={
                                    <button
                                      disabled
                                      className="rounded-lg bg-slate-600 px-3 py-1 text-xs font-semibold text-slate-400 cursor-not-allowed"
                                    >
                                      Delete
                                    </button>
                                  }
                                >
                                  <button
                                    onClick={() => void handleDeleteCompetitor(competitor.id)}
                                    disabled={competitorLoading}
                                    className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                </PermissionGuard>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </MarketingServiceGuard>
  );
}