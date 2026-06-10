#include <bits/stdc++.h>
using namespace std;

int main() {
    int t;
    cin >> t;
    while (t--) {
    int n, k;
    string s;
    cin >> n >> k >> s;
    vector<int> l(n + 1), r(n + 1);
    for (int i = 0; i < n; i++)
        l[i + 1] = l[i] + (s[i] == '(');
    for (int i = n - 1; i >= 0; i--)
        r[i] = r[i + 1] + (s[i] == ')');
    int p = 0, mn = 1e9;
    for (int i = 0; i <= n; i++) {
        if (l[i] + r[i] < mn) {
            mn = l[i] + r[i];
            p = i;
        }
    }
    string ans(n, '0');
    vector<int> v;
    for (int i = 0; i < p; i++)
        if (s[i] == '(') v.push_back(i);
    for (int i = p; i < n; i++)
        if (s[i] == ')') v.push_back(i);
    for (int i = 0; i < min(k, (int)v.size()); i++)
        ans[v[i]] = '1';
    cout << ans << '\n';
    }
}