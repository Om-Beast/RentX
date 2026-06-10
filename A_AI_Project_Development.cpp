#include <bits/stdc++.h>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
    long long n, x, y, z;
    cin >> n >> x >> y >> z;
    long long a = (n + x + y - 1) / (x + y);
    long long b;
    if (x * z >= n) {
        b = (n + x - 1) / x;
    } else {
        long long r = n - x * z;
        b = z + (r + x + 10 * y - 1) / (x + 10 * y);
    }
    cout << min(a, b) << "\n";
    }

}