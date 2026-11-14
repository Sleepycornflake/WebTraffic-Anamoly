# 3. Traditional Machine Learning Approaches

<!-- DRAFT v1, Nov 14. Every claim is traced to a source in the comment after its paragraph.
Main source: [Liu2012] (read in full via the authors' copy), which also describes One-Class SVM and LOF
as baselines. Also [Xu2023] (abstract read), [Jha2022], [Ali2020] (scope only; full text not read).
Not on Member 1's list: the original One-Class SVM (Schölkopf et al. 2001 / Tax & Duin 2004) and LOF
(Breunig et al. 2000) papers. Liu2012 is cited as a secondary source for both; adding the originals would
be stronger, but only with Member 1's OK. -->

Classical anomaly detectors differ in how they decide that a point is unusual. Distance-based methods flag points far from their neighbours, density-based methods flag points in sparser regions than their neighbours, boundary-based methods learn a region that encloses normal data, and isolation-based methods flag points that are easy to separate from the rest [Liu2012]. This section describes the three methods this survey focuses on, one from each of the last three families: Isolation Forest, One-Class SVM and the Local Outlier Factor. Other classical methods, such as k-means clustering and Gaussian mixture models, are also common in practice, often in combination with each other [Jha2022, Ali2020].
<!-- Liu2012 §3 compares isolation, density and distance measures; related work describes one-class SVM as
finding "the smallest region that contains most of the normal data points". Jha2022 conclusion: "The
majority of the papers evaluated employ K-means and GMM ... It is usual to combine two or more clustering
and/or classification techniques." Ali2020 reference list includes k-means, GMM and SVM works. -->

## 3.1 Isolation Forest

Isolation Forest [Liu2012] starts from the observation that anomalies are "few and different", which makes them easier to isolate than normal points. It builds an ensemble of isolation trees. Each tree is grown on a small random subsample of the data: at every node it picks a random feature and a random split value, and it keeps splitting until each point is isolated or a depth limit is reached. The number of splits needed to isolate a point equals its path length from the root. Anomalies, being few and different, tend to be separated after only a few splits, while normal points in dense regions need many. In the authors' illustration, a normal point needs twelve random partitions to be isolated and an anomaly only four. Averaging the path length over many trees gives a stable anomaly score, and a short average path means anomalous.

The method has two training parameters, the number of trees and the subsample size. The authors find that a subsample of 256 points and 100 trees are generally enough across a wide range of data sets, and use them as defaults [Liu2012]. Because each tree sees only a small subsample and no distances or densities are computed, Isolation Forest has linear time complexity and a small, constant memory requirement, which makes it practical for large volumes of traffic.

**Swamping and masking.** Two failure modes affect anomaly detectors when there is too much data relative to the anomalies [Liu2012]. *Swamping* happens when normal points lie close to anomalies and are wrongly flagged. *Masking* happens when anomalies form large, dense clusters that hide their own presence. Isolation Forest reduces both effects through subsampling: a small subsample contains fewer normal points interfering with the anomalies and smaller anomaly clusters, so the anomalies are easier to isolate. The authors' own experiments show the limit of this, however. When anomaly clusters are dense, enlarging the subsample beyond a certain size makes detection worse [Liu2012].

**Training without anomalies.** Liu et al. also show that Isolation Forest still detects anomalies when none are present in its training sample, because the trees describe where normal data lies [Liu2012]. The method can therefore be used in both the unsupervised and the semi-supervised setting of Section 2.3. Section 6 tests both and finds an important qualification to this property.

**Limitations.** Isolation Forest detects scattered anomalies and global clusters of anomalies, but fails on local clusters, i.e. anomalies that sit close to a normal cluster [Liu2012]. Its splits are also axis-parallel: each cut uses a single feature. Xu et al. argue that this causes it to miss "hard" anomalies that cannot be separated by cuts along single features, especially in high-dimensional data, and to assign misleadingly low scores in some regions, both of which raise false negatives [Xu2023]. Their Deep Isolation Forest maps the data through randomly initialised neural networks and applies isolation to these random representations, which allows non-linear partitions of the original data. This extension links the isolation idea to the representation-learning methods of Section 4.
<!-- Liu2012: "anomalies are those instances which have short average path lengths on the iTrees"; Fig 1
(twelve vs four partitions); defaults ψ=256 and t=100; "iForest utilizes no distance or density
measures"; linear time, small memory; swamping/masking definitions and subsampling as remedy; Mulcross:
"increase of ψ has an adverse effect ... after ψ > 64. It is due to the masking effect"; detects
anomalies "even in their absence in the training set"; "iForest fails to detect local clustered
anomalies". Xu2023 abstract: axis-parallel isolation fails on hard anomalies in high-dimensional /
non-linearly-separable space, algorithmic bias gives lower scores to artefact regions, high false
negatives; randomly initialised networks map data to random representation ensembles. -->

## 3.2 One-Class SVM

The One-Class Support Vector Machine is a boundary method: it learns the smallest region of the feature space that contains most of the normal training points, and treats points outside this region as anomalies [Liu2012]. It is a natural fit for the semi-supervised setting, since it is trained on normal data only. Because it models only the boundary of the normal data, it can work from a fairly small training sample: in Liu et al.'s experiments, One-Class SVM reached its best performance using a quarter of the data [Liu2012].

Its drawback is cost on large data. In the same experiments, Isolation Forest was significantly faster than One-Class SVM on data sets with more than a thousand points, and performed favourably to it in AUC [Liu2012]. Results like these depend on the data sets and settings used, and Section 5 compares the methods across more studies.
<!-- Liu2012 related work: "In one-class SVM ..., the aim is to find the smallest region that contains
most of the normal data points; the points outside of this region are deemed anomalies." Fig 14 text:
"Because SVM constructs a boundary for normal points, it is able to construct one with a small sample;
thus SVM has reached the best detection performance with sampling ratio 0.25." Table IV caption:
"iForest performs favourably to ORCA and SVM in terms of AUC and processing time ... significantly
faster than ORCA and SVM for large data sets where n > 1000." -->

## 3.3 Local Outlier Factor and distance-based methods

The Local Outlier Factor (LOF) is a density-based method. It compares the density around each point, measured through its k nearest neighbours, with the density around those neighbours, and flags points that lie in noticeably sparser regions than their neighbours. Distance-based methods such as ORCA work similarly but use the distance to the k-th nearest neighbour directly [Liu2012].

Both families depend on distance calculations between points, which makes them expensive on large data sets. Pairwise distance computation has a worst-case quadratic cost, although optimisations bring some implementations close to linear time in favourable cases [Liu2012]. Both also have a structural weakness: distance and density measures detect scattered anomalies well, but struggle with anomalies that form dense clusters, since points in such a cluster have close neighbours and look normal by these measures [Liu2012]. On scattered anomalies, LOF and Isolation Forest perform similarly. On clustered anomalies, Liu et al. report that Isolation Forest performs better, and it also had the higher AUC on most of the real data sets on which both methods were run (Section 5.2) [Liu2012].
<!-- Liu2012: LOF and ORCA use k nearest neighbours; ORCA "worse case time-complexity is still O(n²)";
"both distance and density measures can only detect scattered anomalies"; "when anomalies are
scattered, iForest has a similar performance as compared with LOF ... When anomalies are clustered ...
iForest clearly has a better performance than LOF and ORCA"; "iForest outperforms LOF in ten out of
eleven data sets". The LOF mechanism sentence (local density vs neighbours' density) is a standard
description; cite the original LOF paper here if Member 1 approves adding it. -->

## 3.4 Summary

Table 3.1 summarises the three methods. All three need feature vectors as input, so for web traffic each request must first be turned into numbers, which is itself a design decision (Section 6.2). None of them sees the order of requests, so they target single-request outliers rather than sequential anomalies (Section 2.2).

Table 3.1: Classical anomaly detectors compared (properties as described by Liu et al. [Liu2012]).

| | Isolation Forest | One-Class SVM | LOF |
|---|---|---|---|
| Idea | Anomalies are isolated after few random splits | Learn a boundary around normal data | Anomalies lie in sparser regions than their neighbours |
| Training data | Unlabelled or normal-only | Normal-only | Unlabelled or normal-only |
| Cost on large data | Linear time, small constant memory | Slower on large data sets | Distance calculations; up to quadratic |
| Clustered anomalies | Handles global clusters, not local ones | Not reported in our sources | Struggles (dense clusters look normal) |
| Main parameters | Number of trees (100), subsample size (256) | Kernel and its parameters | Number of neighbours k |

<!-- "Kernel and its parameters" for OCSVM, k for LOF, and LOF training on unlabelled or normal-only data are standard facts but not stated in the parts of
Liu2012 that were read; Member 1 should confirm or cite the originals. -->
