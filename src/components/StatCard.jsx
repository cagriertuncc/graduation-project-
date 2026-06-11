export default function StatCard({ icon, value, label, color = "purple", delay = 0 }) {
    return (
        <div
            className={`glass-card stat-card ${color} animate-fade-in`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="stat-card-icon">{icon}</div>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
        </div>
    );
}
