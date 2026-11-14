# Working reference list

Mirror of the Mendeley library (the course requires Mendeley; this file is just a checklist).

**Source list chosen by Member 1** (sent Oct 27, 2026; DOIs checked against Crossref on Nov 14). Any source added beyond her list needs her OK, since she does the final citation check.

Status: ✅ verified (metadata confirmed) · ➕ proposed addition, needs Member 1's OK · ❌ do not cite

## Member 1's list

| Status | Reference (IEEE-style details) | Link | Use in paper |
|---|---|---|---|
| ✅ | W. A. Ali, K. N. Manasa, M. Aljunid, M. Bendechache, P. Sandhya, "Review of current machine learning approaches for anomaly detection in network traffic," *J. Telecommun. Digit. Econ.*, vol. 8, no. 4, pp. 64–95, 2020. | doi:10.18080/jtde.v8n4.307 | Sec 2–3: taxonomy, traditional ML (IF, OCSVM, LOF); survey structure |
| ✅ | M. Landauer, S. Onder, F. Skopik, M. Wurzenberger, "Deep learning for anomaly detection in log data: A survey," *Mach. Learn. Appl.*, vol. 12, art. 100470, 2023. | doi:10.1016/j.mlwa.2023.100470 | Sec 4: deep learning (autoencoders, LSTM, embeddings); Sec 5 table. Note: four authors, including Onder |
| ✅ | S. He, P. He, Z. Chen, T. Yang, Y. Su, M. R. Lyu, "A survey on automated log analysis for reliability engineering," *ACM Comput. Surv.*, vol. 54, no. 6, pp. 1–37, 2021. | doi:10.1145/3460345 | Sec 1, 4, 7: log parsing and representation, open challenges |
| ✅ | R. B. Yadav, P. S. Kumar, S. V. Dhavale, "A survey on log anomaly detection using deep learning," in *Proc. 8th ICRITO*, 2020, pp. 1215–1220. | doi:10.1109/ICRITO48877.2020.9197818 | Sec 4–5: deep-learning methods and comparison table |
| ✅ | C. Torrano-Giménez, A. Pérez-Villegas, G. Álvarez Marañón, "HTTP DATASET CSIC 2010," Information Security Institute, CSIC, 2010. | description PDF (hosted on petescully.co.uk mirror, do not cite the mirror) | Sec 6.1 dataset |
| ✅ | B. K. Jha, Nisha, "Anomaly detection for web log data analysis: A review," *Int. J. Sci. Dev. Res.*, vol. 7, no. 6, 2022. | ijsdr.org/papers/IJSDR2206096.pdf | Sec 1, 7: web-log focus; 29.55% public-dataset figure. Cite survey content only |

## Proposed additions (ask Member 1)

The case study relies on Isolation Forest's original papers; none of her six sources is the primary source for it.

| Status | Reference | Why needed |
|---|---|---|
| ➕ | F. T. Liu, K. M. Ting, Z.-H. Zhou, "Isolation forest," in *Proc. 8th IEEE ICDM*, 2008, pp. 413–422. | Defines the method, default hyperparameters (100 trees, 256 samples), masking/swamping. Cited throughout Sec 6 |
| ➕ | F. T. Liu, K. M. Ting, Z.-H. Zhou, "Isolation-based anomaly detection," *ACM Trans. Knowl. Discov. Data*, vol. 6, no. 1, 2012. | Optional; extended version of the above |
| ➕ | G. Pang, C. Shen, L. Cao, A. van den Hengel, "Deep learning for anomaly detection: A review," *ACM Comput. Surv.*, vol. 54, no. 2, 2021. | Optional; Sec 6.5 cites it for deep representations. Landauer et al. could replace it |
