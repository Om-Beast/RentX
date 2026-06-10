#include <bits/stdc++.h>
using namespace std;

int main() {
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;

        if (n == 2) {
            cout << "1 2 1 1 2 2 1 2\n";
            continue;
        }
        vector<int> v;
        for (int i = 1; i <= n; i++) {
            v.push_back(i);
        }
        for (int i = 1; i <= n; i++) {
            v.push_back(i);
        }
        v.push_back(n);
        for (int i = 1; i < n; i++){
             v.push_back(i);
        }

        for (int i = n - 2; i <= n; i++) {
            v.push_back(i);
        }
        for (int i = 1; i <= n - 3; i++) {
            v.push_back(i);
        }

        for (int x : v) cout << x << ' ';
        cout << '\n';
    }
}