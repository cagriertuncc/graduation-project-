import { FiClock, FiCheckCircle } from "react-icons/fi";

export default function DiseaseTag({ disease }) {
    const statusClass = disease.severity === "ciddi" ? "ciddi" : disease.status;

    return (
        <span className={`disease-tag ${statusClass}`}>
            {disease.status === "tedavi" ? <FiClock size={12} /> : <FiCheckCircle size={12} />} {disease.name}
        </span>
    );
}
