#include <bits/stdc++.h>
using namespace std;

bool ok(const vector<long long>& a) {
    unordered_map<long long,int> f, l, c;
    int n = a.size();

    for (int i = 0; i < n; i++) {
        if (!f.count(a[i])) f[a[i]] = i;
        l[a[i]] = i;
        c[a[i]]++;
    }

    for (auto &p : c) {
        long long x = p.first;
        if (l[x] - f[x] + 1 != c[x]) return false;
    }
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int tstCNum;
    cin >> tstCNum;

    while (tstCNum--) {
        int n;
        cin >> n;

        vector<long long> a(n);
        for (int i = 0; i < n; i++) cin >> a[i];

        if (ok(a)) {
            cout << "YES\n";
            continue;
        }

        unordered_map<long long,int> runs;
        for (int i = 0; i < n; ) {
            int j = i;
            while (j < n && a[j] == a[i]) j++;
            runs[a[i]]++;
            i = j;
        }

        vector<long long> bad;
        for (auto &p : runs) {
            if (p.second > 1) bad.push_back(p.first);
        }

        if ((int)bad.size() > 2) {
            cout << "NO\n";
            continue;
        }

        vector<int> pos;
        for (int i = 0; i < n; i++) {
            bool take = false;

            for (auto x : bad) {
                if (a[i] == x) take = true;
            }

            if (take) {
                pos.push_back(i);
                if (i) pos.push_back(i - 1);
                if (i + 1 < n) pos.push_back(i + 1);
            }
        }

        sort(pos.begin(), pos.end());
        pos.erase(unique(pos.begin(), pos.end()), pos.end());

        bool ans = false;

        for (int i = 0; i < (int)pos.size() && !ans; i++) {
            for (int j = i; j < (int)pos.size() && !ans; j++) {
                vector<long long> b = a;
                swap(b[pos[i]], b[pos[j]]);
                if (ok(b)) ans = true;
            }
        }

        cout << (ans ? "YES" : "NO") << '\n';
    }

    return 0;
}