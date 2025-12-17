# 🎓 Result Management System (RMS)

The **Result Management System (RMS)** is a comprehensive platform designed to automate and simplify the process of academic result handling. It enables **students** to upload their result PDFs, which are processed using **OCR (Optical Character Recognition)** to extract and structure data automatically. The extracted data is securely stored in a database, allowing **professors** to view analytics, such as **passing rates**, **topper lists**, and **downloadable Excel reports**.

RMS eliminates manual errors, enhances data accessibility, and supports **data-driven academic decisions** through interactive dashboards and automated workflows.

### 🔑 Key Features
- 📄 PDF Upload with OCR text extraction (Tesseract)
- 🧮 Automated result parsing and structured data storage
- 📊 Real-time analytics and visualization
- 🧠 Statistical insights: Passing rates, toppers, performance trends
- 🔐 Secure authentication and role-based access (Student, Professor, Admin)
- 💾 Excel export for offline report generation
- ⚙️ Scalable, modular, and institution-friendly design

### 🧰 Tech Stack
- **Backend:** Django / Python  
- **OCR Engine:** Tesseract  
- **Frontend:** HTML, CSS, JavaScript / Bootstrap  
- **Database:** MySQL / SQLite  
- **Security:** Role-based access control, data encryption  

RMS ensures secure, efficient, and automated management of academic results, making it a modern solution for educational institutions.


## 👨‍💻 8. Installation & Setup

```bash
# Clone the repository
git clone https://github.com/abhighali79/Student_result_analysis.git

# Create virtual environment (optional but recommended)
python -m venv env
source env/bin/activate  # for Linux/macOS
env\Scripts\activate     # for Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the server
python manage.py runserver
