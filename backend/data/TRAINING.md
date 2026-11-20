# Training the phishing models

The starter model is included only as an offline fallback. To create and load a model trained on real labeled examples:

1. Download **Balanced_Dataset.csv** from the [Zenodo Phishing Email Detection Dataset](https://zenodo.org/records/17314806). Its published CSV uses email text/type columns and labels such as `Phishing Email` and `Safe Email`.
2. Download **PhiUSIIL_Phishing_URL_Dataset.csv** from the [UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/967/phiusil-phishing-url-dataset). The UCI label is `0` for phishing and `1` for legitimate. This trainer learns from the raw URL column; it does not use the dataset's webpage-derived features.
3. Put both CSVs in `backend/data/raw/` (this folder is gitignored), then run from `backend/`:

```powershell
npm run train:models -- --email data/raw/Balanced_Dataset.csv --url data/raw/PhiUSIIL_Phishing_URL_Dataset.csv --url-phishing-label 0 --attribution "Zenodo DOI 10.5281/zenodo.17314806; UCI PhiUSIIL DOI 10.1016/j.cose.2023.103545"
```

The trainer detects common column names such as `Email Text`, `Email Type`, `URL`, and `label`. For other column names, pass `--email-text`, `--email-label`, `--url-text`, or `--url-label` with the exact header. Rows with empty texts and exact duplicate labeled texts are removed. It writes `backend/models/trained-models.json` and a held-out metrics report at `backend/models/training-report.json`.

Restart the backend after training. `/api/health` reports `mlModelSource: "dataset-trained"` and includes the saved evaluation metrics. Dataset-trained ML is then used for email and URL scoring, ahead of the optional OpenAI path. The 80/20 deterministic stratified split is a quick check, not proof of performance on current attacks; these public corpora may contain old samples, source-specific patterns, duplicates, or synthetic examples. Check the source licenses and citations before redistribution.

The seed model remains active until both CSV files have been trained into an artifact. Python and additional npm packages are not required.

## Model currently in this workspace

The full 358.8 MB email CSV transfer repeatedly reset. A labeled email model was therefore trained from the first 41.9 MB (18,422 legitimate examples) plus 1,560 unique phishing examples from the curated Nazario corpus. URL training used all 235,370 unique URLs from PhiUSIIL. The saved report records these source counts and the 80/20 results. Reproduce the current model with:

```powershell
npm run train:models -- --email data/raw/email_training_sample.csv --email-phishing-file data/raw/Nazario.csv --url data/raw/PhiUSIIL_Phishing_URL_Dataset.csv --url-phishing-label 0 --attribution "Email: Zenodo 10.5281/zenodo.17314806 partial; Nazario: Zenodo 10.5281/zenodo.8339691; URL: UCI PhiUSIIL"
```

The email evaluation has lower phishing recall than the URL evaluation, and its two email classes come from different corpora. Treat these measurements as an initial check; they do not establish performance on recent email attacks. A complete, source-matched email corpus should replace this partial training set before relying on it operationally.
