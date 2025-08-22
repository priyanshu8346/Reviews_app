from flask import Flask, request, jsonify
from dotenv import load_dotenv
import re
load_dotenv()
import os
import json
from openai import OpenAI

app = Flask(__name__)
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

@app.route('/analyze', methods=['POST'])
def analyze_review():
    try:
        data = request.json
        review_text = data.get('text', '')
        if not review_text:
            return jsonify({"error": "No text provided"}), 400

        prompt = f"""
        Analyze the following customer review and return ONLY JSON:
        ---
        {review_text}
        ---
        The JSON must include exactly these keys:
        sentiment: "positive", "neutral" or "negative"
        spam: true or false
        score: number between 0 and 1
        problems: array of short strings of issues (can be empty)
        goodPoints: array of short strings of positives (can be empty)

        ONLY output JSON. No extra text or formatting like ```json fences.
        """

        response = client.responses.create(
            model="gpt-4o",
            input=prompt,
            temperature=0
        )

        result_text = response.output_text.strip()
        clean_text = re.sub(r"^```json\s*|\s*```$", "", result_text.strip(), flags=re.MULTILINE)

        try:
            result = json.loads(clean_text)
        except json.JSONDecodeError:
            return jsonify({
                "error": "Invalid JSON from GPT-4o",
                "raw": result_text
            }), 500

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/insights', methods=['POST'])
def summarize_reviews():
    try:
        data = request.json
        problems = data.get('problems', [])
        good_points = data.get('goodPoints', [])

        # If no reviews, return early to avoid calling OpenAI
        if not problems and not good_points:
            return jsonify({"summary": "No reviews available yet."})

        prompt = f"""
        Summarize the following customer feedback into clear insights.
        Problems reported: {problems}
        Good points mentioned: {good_points}

        Return STRICT JSON with:
        summary: a short text summarizing the top complaints and top praises.
        """

        response = client.response.create(
            model="gpt-4",
            input=prompt,
            temperature=0
        )

        import json
        result_text = response.choices[0].message['content']
        result = json.loads(result_text)  # must be valid JSON

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
