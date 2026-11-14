# Machine Learning for Anomaly Detection in Web and API Traffic: An Overview

<!-- DRAFT v1, Nov 14. Title, abstract, index terms and Section 1. Numbers in the abstract come from
results/metrics/isolation_forest_run.json (seed 42). Source notes in comments as in other sections. -->

## Abstract

Web applications and APIs are attacked through the same HTTP requests that carry their legitimate traffic, and signature-based defences recognise only attacks that have already been described. Anomaly detection addresses this by modelling normal behaviour and flagging departures from it. This paper surveys machine-learning approaches to anomaly detection for web and API traffic. We describe the supervised, semi-supervised and unsupervised learning settings; classical detectors (Isolation Forest, One-Class SVM and the Local Outlier Factor); and deep-learning approaches (recurrent networks, autoencoders, convolutional networks, transformers and deep isolation). We then compare them using results from the literature. To illustrate the surveyed ideas, we apply Isolation Forest to raw HTTP requests from the public CSIC 2010 dataset, in both a semi-supervised and an unsupervised setting. The case study shows that a model trained only on normal traffic ignores every feature that never varies in that traffic, including most attack signatures, and that the unsupervised setting ranks attacks better (ROC-AUC 0.930 against 0.800 on the same data) only while attacks remain rare. We close with the open challenges, chief among them the lack of current, public web-traffic datasets.

**Index Terms:** anomaly detection, web security, HTTP traffic, isolation forest, machine learning, deep learning, survey.

## 1. Introduction

Web applications and APIs expose their functionality to anyone who can send an HTTP request, and attacks such as SQL injection, cross-site scripting or requests for hidden files arrive inside that ordinary request stream. The traditional defence matches requests against rules or keyword signatures written by analysts. This works for known attacks, but it requires continuous manual effort and cannot recognise attacks that have not yet been described [Jha2022].

Anomaly-based detection reverses the approach: it learns what normal traffic looks like and flags requests that deviate from it, so it can in principle detect new attacks [Jha2022]. Machine learning is the standard way to build such models, and a large body of work applies both classical and deep-learning methods to network traffic [Ali2020] and to the logs that servers and applications produce [Landauer2023, He2021, Yadav2020]. The approaches differ in what data they need, what kind of anomaly they can see and how well they scale. A practitioner choosing between them faces a further problem: published results are rarely comparable, because studies use different and often private datasets. Jha and Nisha report that only 29.55% of the experimental results in the studies they reviewed rely on public datasets [Jha2022].

This paper gives an overview of the field aimed at readers who need to choose or evaluate a method for web and API traffic. Its contributions are:

1. A summary of the learning settings and anomaly types that frame the field (Section 2).
2. An overview of classical detectors (Section 3) and deep-learning approaches (Section 4), with their assumptions and limits.
3. A comparison built from published results, including the conditions under which those results hold (Section 5).
4. An illustrative case study that applies Isolation Forest to raw HTTP requests in two learning settings and shows how the method's assumptions play out on real data (Section 6). The case study is a worked example, not a benchmark.
5. A discussion of open challenges, including the case study's own limitations (Section 7).

Section 8 concludes.
<!-- Jha2022 intro: conventional detection uses keyword search and rule matching, needs manual work,
cannot detect unidentified attacks; anomaly detection flags departures from established patterns;
conclusion: 29.55% public datasets. Ali2020: ML review for network traffic (title/abstract). Landauer2023,
He2021, Yadav2020: surveys of log anomaly detection (titles/abstracts). -->
