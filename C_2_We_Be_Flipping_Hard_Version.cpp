#include <iostream>
#include <vector>
#include <cmath>
#include <algorithm>
#include <list>

using namespace std;

void solve() {
    int n;
    cin >> n;
    vector<long long> a(n + 1);
    for (int i = 1; i <= n; ++i) {
        cin >> a[i];
    }
    vector<long long> pref_abs(n + 2, 0);
    for (int i = 1; i <= n; ++i) {
        pref_abs[i] = pref_abs[i - 1] + abs(a[i]);
    }
    vector<long long> suff_val(n + 2, 0);
    for (int i = n; i >= 1; --i) {
        suff_val[i] = suff_val[i + 1] + a[i];
    }

    long long best_score = suff_val[1];
    int best_M = 0;

    for (int M = 1; M <= n; ++M) {
        if (a[M] > 0) {
            long long current_score = pref_abs[M - 1] - a[M] + suff_val[M + 1];
            if (current_score > best_score) {
                best_score = current_score;
                best_M = M;
            }
        }
    }

    if (best_M == 0) {
        cout << 0 << "\n\n";
        return;
    }

    vector<int> c(n + 2, 0);
    for (int j = 1; j < best_M; ++j) {
        if (a[j] < 0) c[j] = 1;
        else c[j] = 0;
    }
    c[best_M] = 1; 

    vector<int> S;
    for (int j = 1; j <= n; ++j) {
        int s_j = c[j] ^ c[j + 1];
        if (s_j == 1) {
            S.push_back(j);
        }
    }

    reverse(S.begin(), S.end());
    list<int> seq;
    if (!S.empty()) {
        seq.push_back(S[0]); 
        for (size_t i = 1; i < S.size(); ++i) {
            if (a[S[i]] > 0) {
                seq.push_front(S[i]);        
            } else {
                seq.insert(next(seq.begin()), S[i]);
            }
        }
    }
    cout << seq.size() << "\n";
    for (int idx : seq) {
        cout << idx << " ";
    }
    cout << "\n";
}

int main() {
    
    int t;
    if (cin >> t) {
        while (t--) {
            solve();
        }
 
}