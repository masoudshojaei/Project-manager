import { motion } from "framer-motion";
import { AlertTriangle, Zap, ShieldAlert, ArrowRight } from "lucide-react";
import type { ProjectData } from "../types";

interface BlockersProps {
  data: ProjectData;
}

export default function Blockers({ data }: BlockersProps) {
  if (data.blockers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-github-green-bright/10 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-github-green-bright" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Active Blockers</h2>
          <p className="text-github-dim">All systems go! No critical blockers at this time.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-github-red/10 border border-github-red/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-github-red" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Active Blockers</h2>
            <p className="text-sm text-github-dim">{data.blockers.length} critical issues blocking progress</p>
          </div>
        </div>

        <div className="space-y-4">
          {data.blockers.map((blocker, idx) => (
            <motion.div
              key={blocker.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-panel p-6 relative overflow-hidden group"
            >
              {/* Red accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-github-red" />

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-github-red/10 flex items-center justify-center shrink-0 mt-1">
                  <Zap className="w-5 h-5 text-github-red" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    🚫 {blocker.title}
                  </h3>

                  <p className="text-sm text-github-fg/80 leading-relaxed mb-4">
                    {blocker.description}
                  </p>

                  {blocker.affects && (
                    <div className="flex items-start gap-2 bg-github-yellow/5 border border-github-yellow/20 rounded-lg p-3">
                      <ArrowRight className="w-4 h-4 text-github-yellow shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold text-github-yellow uppercase tracking-wider">Affects</span>
                        <p className="text-sm text-github-fg mt-1">{blocker.affects}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-github-red/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 rounded-xl bg-github-card/50 border border-github-border text-center"
        >
          <p className="text-sm text-github-dim">
            These blockers must be resolved before the affected milestones can proceed.
            <br />
            Review and update STATUS.md to track resolution progress.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
