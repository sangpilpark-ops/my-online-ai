# 나만의 온라인 작업실

GitHub Pages로 공개 가능한 HTML·CSS·JavaScript 앱. 공개되는 건 코드입니다. 사내 자료, 모델 학습 원본, 개인 파일, 비밀키를 저장소에 넣지 마세요.

배포: 승인 받은 공개 저장소의 main 브랜치 루트에 이 ZIP을 압축 해제한 파일을 배치하고, Settings → Pages → Deploy from a branch → main / (root)를 선택합니다. PC 미리보기는 이 폴더의 터미널에서 `python -m http.server 8179 --bind 127.0.0.1` 후 Chrome에서 `http://127.0.0.1:8179/`로 엽니다. file:// 더블클릭으로는 워커를 불러올 수 없습니다.

- 사진: HuggingFaceTB/SmolVLM-256M-Instruct (Apache-2.0). 영어 질문에 가장 적합합니다. 한 번에 사진 한 장을 설명하거나 사진에 관한 질문에 답합니다. 정확한 OCR·신원 확인·전문적 진단 기능이 아닙니다.
- 텍스트: onnx-community/Qwen2.5-0.5B-Instruct (Apache-2.0). 가벼운 질문·초안 처리용입니다.
- 두 모델은 Transformers.js로 브라우저에서 실행됩니다. 앱 코드에 사진이나 질문을 업로드하는 연결은 없습니다. 처음에는 공개 모델과 실행 파일을 인터넷에서 받습니다. 모델당 수백 MB이며 장치와 브라우저에 따라 느리거나 메모리 부족이 날 수 있습니다. 최신 데스크톱 Chrome/Edge부터 시험하세요.
- Colab에서 따로 학습하는 조작 판단 모델 GGUF는 포함하지 않았습니다. GitHub Pages는 정적 웹 호스팅이라 Colab이나 로컬 Ollama 서버를 상시 실행하지 않습니다. 이 웹앱은 PC 원격 제어도 하지 않습니다.