import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

print(f"🔑 API Key Terbaca: {api_key[:5]}...******")

try:
    print("⏳ Menghubungi Gemini 1.5 Flash...")
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        api_key=api_key
    )

    response = llm.invoke("Tes koneksi! Jawab 'Hadir' jika kamu aktif.")
    print("\n✅ SUKSES! Balasan Gemini:")
    print(response)

except Exception as e:
    print("\n❌ GAGAL:")
    print(e)
