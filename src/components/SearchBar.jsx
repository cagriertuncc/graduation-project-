import { FiSearch } from "react-icons/fi";

export default function SearchBar({ value, onChange, placeholder = "Hasta ara..." }) {
    return (
        <div className="search-bar-container">
            <span className="search-bar-icon"><FiSearch size={15} /></span>
            <input
                type="text"
                className="search-bar"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}
