# 8. Conclusion

<!-- DRAFT v1, Nov 14. Conclusion and author contributions. No new claims: everything here is stated, with
its source, in Sections 2-7. -->

This paper has surveyed machine-learning approaches to anomaly detection for web and API traffic. Classical detectors such as Isolation Forest, One-Class SVM and the Local Outlier Factor work on single requests described by feature vectors and differ mainly in how they define "unusual": by isolation, by a boundary around normal data or by local density. In the comparison by its authors, Isolation Forest scaled best and coped best with clustered anomalies. Deep-learning approaches learn their own representations and, through recurrent and transformer models, can detect anomalies in sequences of events that single-request methods cannot see; training on normal data only is widely used among them. Published comparisons are scarce, use different and often private data, and for deep models rely almost entirely on system logs rather than web traffic, so the choice of method depends more on the available data and the kind of attack than on any single reported score.

Our case study illustrated these points on raw HTTP requests from CSIC 2010. Isolation Forest trained only on normal traffic ignored every feature that never varies in that traffic, including most of the attack signatures we designed. Trained on unlabelled traffic in which attacks were rare, the same model ranked attacks clearly better, but when attacks made up 41% of the data it caught only the most extreme 27% of them. Both results follow directly from the method's assumptions, which shows why those assumptions matter more than benchmark scores when applying a method to new data.

The most pressing need is for current, realistic and public web-traffic datasets, without which methods cannot be compared fairly. Beyond that, models that adapt to changing applications, use request sequences and choose thresholds without labelled data would bring anomaly detection closer to practical use for web and API security.

## Author Contributions

<!-- Agreed split (Nov 14). Edit the wording if the course asks for a specific format. -->

Member 1 selected the literature on which the survey is based and carried out the final review of the paper, including checking citations, consistency and originality. Member 2 prepared the dataset, implemented and ran the case study, and wrote the manuscript.

<!-- Replace "Member 1" and "Member 2" with names. -->
