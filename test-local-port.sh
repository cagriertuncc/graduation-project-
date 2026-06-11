echo 'Testing frontend API proxy...'
curl -I -s "http://localhost:5173/api/patient-portal/doctors" | grep HTTP
