import axios from "axios";

async function test() {
    try {
        const res = await axios.get("http://localhost:5000/api/patient-portal/doctors");
        console.log("Status:", res.status);
        if (res.data.length > 0) {
            console.log("First doctor:", res.data[0]);
        } else {
            console.log("Empty array returned.");
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}
test();
