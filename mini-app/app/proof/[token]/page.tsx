import { getPublicCompetencyProofShare } from "../../../lib/academy-store";

type ProofPageProps = {
  params: Promise<{ token: string }> | { token: string };
};

function statusLabel(status: string) {
  if (status === "achieved") return "Evidenced";
  if (status === "in_progress") return "In progress";
  return "Pending";
}

export default async function CompetencyProofPage({ params }: ProofPageProps) {
  const resolvedParams = await params;
  const proof = await getPublicCompetencyProofShare(resolvedParams.token);

  if (!proof) {
    return (
      <main className="proof-public-shell proof-public-empty">
        <section className="proof-public-card">
          <p className="eyebrow">ACADEMY PROOF</p>
          <h1>Proof not available</h1>
          <p>
            This competency proof may have expired, been revoked, or not been
            generated yet.
          </p>
        </section>
      </main>
    );
  }

  const graph = proof.snapshot.competencyGraph;
  const achievedNodes = graph.nodes.filter((node) => node.status === "achieved");
  const activeNodes = graph.nodes.filter((node) => node.evidenceCount > 0);

  return (
    <main className="proof-public-shell">
      <section className="proof-public-card">
        <div className="proof-public-header">
          <div>
            <p className="eyebrow">ACADEMY COMPETENCY PROOF</p>
            <h1>{proof.snapshot.learner.displayName}</h1>
            {proof.snapshot.learner.telegramUsername ? (
              <p className="proof-public-muted">
                @{proof.snapshot.learner.telegramUsername}
              </p>
            ) : null}
          </div>
          <div className="proof-public-score">
            <span>{graph.overallScore}%</span>
            <small>overall</small>
          </div>
        </div>

        <div className="proof-public-rule">
          <strong>Nothing counts unless it is evidenced.</strong>
          <span>
            This page only shows accepted evidence recorded by Academy Core.
          </span>
        </div>

        <div className="proof-public-grid">
          <div>
            <span>{graph.evidencedNodeCount}</span>
            <small>evidenced nodes</small>
          </div>
          <div>
            <span>{graph.totalNodeCount}</span>
            <small>total nodes</small>
          </div>
          <div>
            <span>{achievedNodes.length}</span>
            <small>achieved</small>
          </div>
        </div>

        <section className="proof-public-section">
          <h2>Competency nodes</h2>
          <div className="proof-public-node-list">
            {activeNodes.length ? (
              activeNodes.map((node) => (
                <article className="proof-public-node" key={node.id}>
                  <div>
                    <h3>{node.title}</h3>
                    <p>{node.description}</p>
                  </div>
                  <div className="proof-public-node-meta">
                    <strong>{node.score}</strong>
                    <span>{statusLabel(node.status)}</span>
                    <small>{node.evidenceCount} evidence</small>
                  </div>
                </article>
              ))
            ) : (
              <p className="proof-public-muted">
                No public evidence has been accepted yet.
              </p>
            )}
          </div>
        </section>

        <footer className="proof-public-footer">
          <span>Generated: {new Date(proof.snapshot.generatedAt).toLocaleString()}</span>
          <span>Views: {proof.viewCount}</span>
        </footer>
      </section>
    </main>
  );
}
