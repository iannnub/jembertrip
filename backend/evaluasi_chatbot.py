# evaluasi_chatbot.py
# ==========================================
# Script Evaluasi Otomatis Chatbot Cak Jember
# Menguji regression_suite.json terhadap backend yang berjalan
# Jalankan dengan: python evaluasi_chatbot.py
# Pastikan backend sudah aktif di http://localhost:8000
# ==========================================

import json
import time
import requests
import os
from datetime import datetime

# ==========================================
# KONFIGURASI
# ==========================================
BACKEND_URL = "http://localhost:8000"
CHAT_ENDPOINT = f"{BACKEND_URL}/api/v1/chat"
SUITE_PATH = "tests/regression_suite.json"
REPORT_PATH = f"tests/eval_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"

# Delay antar request (detik) agar tidak kena rate limit
REQUEST_DELAY = 2.0


# ==========================================
# LOAD TEST SUITE
# ==========================================
def load_suite(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ==========================================
# KIRIM PERTANYAAN KE CHATBOT
# ==========================================
def ask_chatbot(question, language="id", session_id=None):
    payload = {
        "question": question,
        "language": language,
        "session_id": session_id
    }
    try:
        response = requests.post(CHAT_ENDPOINT, json=payload, timeout=40)
        if response.status_code == 200:
            return response.json().get("answer", "")
        else:
            return f"[HTTP ERROR {response.status_code}]"
    except requests.exceptions.Timeout:
        return "[TIMEOUT]"
    except requests.exceptions.ConnectionError:
        return "[CONNECTION ERROR - Backend tidak aktif?]"


# ==========================================
# EVALUASI SATU TEST CASE
# ==========================================
def evaluate_case(tc, answer):
    passed = True
    issues = []

    # Cek must_contain (semua harus ada)
    if "must_contain" in tc:
        for keyword in tc["must_contain"]:
            if keyword.lower() not in answer.lower():
                passed = False
                issues.append(f"MISSING keyword: '{keyword}'")

    # Cek must_contain_one_of (minimal satu harus ada)
    if "must_contain_one_of" in tc:
        found = any(k.lower() in answer.lower() for k in tc["must_contain_one_of"])
        if not found:
            passed = False
            issues.append(f"MISSING one_of: {tc['must_contain_one_of']}")

    # Cek must_not_contain (tidak boleh ada sama sekali)
    if "must_not_contain" in tc:
        for keyword in tc["must_not_contain"]:
            if keyword.lower() in answer.lower():
                passed = False
                issues.append(f"FORBIDDEN keyword ditemukan: '{keyword}'")

    # Deteksi pola halusinasi nomor/harga/telepon
    if tc.get("must_not_hallucinate_numbers") or tc.get("must_not_hallucinate_price") or tc.get("must_not_hallucinate_phone") or tc.get("must_not_hallucinate_schedule"):
        # Pola sederhana: angka spesifik yang mencurigakan dalam jawaban
        # (angka > 4 digit beruntun yang tidak diawali peringatan)
        warn_words = ["belum", "tidak punya", "konfirmasi", "cek langsung", "tidak ada", "belum ada", "hubungi"]
        has_warning = any(w.lower() in answer.lower() for w in warn_words)

        import re
        # Cari pola nomor telepon (0xxx-xxxxxxx atau (0xxx) xxxxxx)
        phone_pattern = re.search(r'\(?\d{3,4}\)?\s*[-\s]?\d{4,8}', answer)
        price_pattern = re.search(r'Rp\.?\s*\d+', answer, re.IGNORECASE)

        if tc.get("must_not_hallucinate_phone") and phone_pattern and not has_warning:
            # Cek apakah nomor ada di knowledge base (simplified check)
            known_numbers = ["487720", "487564", "484114", "488888", "487105", "112", "113", "118"]
            found_number = phone_pattern.group()
            number_digits = re.sub(r'\D', '', found_number)
            if not any(k in number_digits for k in known_numbers):
                passed = False
                issues.append(f"POTENSI HALUSINASI nomor telepon: '{found_number}'")

        if tc.get("must_not_hallucinate_price") and price_pattern and not has_warning:
            issues.append(f"[WARNING] Harga spesifik ditemukan tanpa peringatan: '{price_pattern.group()}' - verifikasi manual")

    # Cek must_not_reject (tidak boleh menolak pertanyaan sah)
    if tc.get("must_not_reject"):
        rejection_words = ["tidak bisa", "tidak dapat", "di luar topik", "bukan topik", "hanya urusan jember", "khusus ngurusin"]
        if any(w.lower() in answer.lower() for w in rejection_words):
            passed = False
            issues.append("SALAH DITOLAK: pertanyaan sah tapi ditolak chatbot")

    return passed, issues


# ==========================================
# MAIN EVALUASI
# ==========================================
def run_evaluation():
    print("=" * 60)
    print("EVALUASI CHATBOT CAK JEMBER - REGRESSION SUITE")
    print(f"Tanggal: {datetime.now().strftime('%d %B %Y, %H:%M:%S')}")
    print("=" * 60)

    # Cek koneksi backend
    try:
        r = requests.get(f"{BACKEND_URL}/", timeout=5)
        print(f"[OK] Backend aktif di {BACKEND_URL}")
    except Exception:
        print(f"[ERROR] Backend tidak bisa dijangkau di {BACKEND_URL}")
        print("Pastikan backend sudah dijalankan (python main.py atau via JALANKAN_JEMBERTRIP.bat)")
        return

    suite = load_suite(SUITE_PATH)
    test_cases = suite["test_cases"]

    print(f"\n[INFO] Memuat {len(test_cases)} test cases dari regression suite...")
    print(f"[INFO] Delay antar request: {REQUEST_DELAY} detik\n")

    results = []
    passed_count = 0
    failed_count = 0
    warning_count = 0

    # Kelompokkan per kategori
    categories = {}
    for tc in test_cases:
        cat = tc.get("category", "unknown")
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(tc)

    report_lines = []
    report_lines.append(f"LAPORAN EVALUASI CHATBOT CAK JEMBER")
    report_lines.append(f"Tanggal: {datetime.now().strftime('%d %B %Y, %H:%M:%S')}")
    report_lines.append("=" * 80)

    for cat, cases in categories.items():
        print(f"\n{'='*50}")
        print(f"KATEGORI: {cat.upper()} ({len(cases)} kasus)")
        print(f"{'='*50}")
        report_lines.append(f"\nKATEGORI: {cat.upper()}")
        report_lines.append("-" * 50)

        cat_passed = 0
        cat_failed = 0

        for tc in cases:
            tc_id = tc["id"]
            priority = tc.get("priority", "P1")
            query = tc["query"]
            expected = tc.get("expected_behavior", "")
            notes = tc.get("notes", "")

            print(f"\n[{tc_id}] ({priority}) {query[:70]}...")

            # Kirim ke chatbot
            start = time.time()
            answer = ask_chatbot(query)
            elapsed = time.time() - start

            if answer.startswith("["):
                print(f"  STATUS : ERROR - {answer}")
                result = {
                    "id": tc_id, "category": cat, "priority": priority,
                    "status": "ERROR", "issues": [answer],
                    "answer_preview": answer, "elapsed": elapsed
                }
                failed_count += 1
                cat_failed += 1
            else:
                passed, issues = evaluate_case(tc, answer)
                status = "PASS" if passed else "FAIL"

                if passed:
                    passed_count += 1
                    cat_passed += 1
                    print(f"  STATUS : PASS ({elapsed:.1f}s)")
                else:
                    failed_count += 1
                    cat_failed += 1
                    print(f"  STATUS : FAIL ({elapsed:.1f}s)")
                    for issue in issues:
                        print(f"  ISSUE  : {issue}")

                print(f"  ANSWER : {answer[:120]}...")

                result = {
                    "id": tc_id, "category": cat, "priority": priority,
                    "status": status, "issues": issues,
                    "answer_preview": answer[:200], "elapsed": elapsed,
                    "expected": expected, "notes": notes
                }

            results.append(result)

            # Report line
            status_str = result.get("status", "ERROR")
            report_lines.append(f"\n[{tc_id}] {status_str} | {priority} | {elapsed:.1f}s")
            report_lines.append(f"  Query   : {query}")
            report_lines.append(f"  Harapan : {expected}")
            report_lines.append(f"  Jawaban : {result['answer_preview']}")
            if result.get("issues"):
                report_lines.append(f"  Issues  : {'; '.join(result['issues'])}")
            if notes:
                report_lines.append(f"  Catatan : {notes}")

            time.sleep(REQUEST_DELAY)

        cat_total = cat_passed + cat_failed
        cat_pct = (cat_passed / cat_total * 100) if cat_total > 0 else 0
        print(f"\n  Subtotal {cat}: {cat_passed}/{cat_total} PASS ({cat_pct:.0f}%)")

    # ==========================================
    # REKAP AKHIR
    # ==========================================
    total = len(results)
    pass_pct = (passed_count / total * 100) if total > 0 else 0
    fail_pct = (failed_count / total * 100) if total > 0 else 0

    print("\n" + "=" * 60)
    print("REKAP HASIL EVALUASI")
    print("=" * 60)
    print(f"Total Test Cases  : {total}")
    print(f"PASS              : {passed_count} ({pass_pct:.1f}%)")
    print(f"FAIL              : {failed_count} ({fail_pct:.1f}%)")
    print()

    # Status kelayakan
    criteria = suite.get("pass_criteria", {})
    min_pass = 100 - criteria.get("max_hallucination_rate_pct", 5)

    if pass_pct >= min_pass:
        print(f"[VERDICT] LULUS - Pass rate {pass_pct:.1f}% >= target {min_pass:.0f}%")
    else:
        print(f"[VERDICT] BELUM LULUS - Pass rate {pass_pct:.1f}% < target {min_pass:.0f}%")
        print("  -> Lihat laporan untuk detail perbaikan yang diperlukan.")

    # Simpan laporan ke file
    report_lines.append("\n" + "=" * 80)
    report_lines.append("REKAP AKHIR")
    report_lines.append(f"Total: {total} | PASS: {passed_count} ({pass_pct:.1f}%) | FAIL: {failed_count} ({fail_pct:.1f}%)")
    verdict = "LULUS" if pass_pct >= min_pass else "BELUM LULUS"
    report_lines.append(f"VERDICT: {verdict}")

    os.makedirs("tests", exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print(f"\n[INFO] Laporan lengkap disimpan di: {REPORT_PATH}")
    return results


if __name__ == "__main__":
    run_evaluation()
