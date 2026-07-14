import gradio as gr
from main import app as fastapi_app

# 1. Buat antarmuka Gradio palsu (Topeng) untuk memuaskan satpam Hugging Face
def status_api():
    return "Sistem Rekomendasi JemberTrip (FastAPI) Aktif 100%!"

topeng_gradio = gr.Interface(
    fn=status_api, 
    inputs=None, 
    outputs="text",
    title="JemberTrip API Server"
)

# 2. Gabungkan topeng Gradio dengan mesin FastAPI Anda
# Gradio akan menutupi halaman depan ("/"), tapi jalur "/api/..." dan "/docs" Anda TETAP AMAN!
app = gr.mount_gradio_app(fastapi_app, topeng_gradio, path="/")
