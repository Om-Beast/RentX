#include <iostream>
#include <string>
#include <vector>
using namespace std;
long long calc(int g, int n, int x, long long s, const string& u) {
    long long desk = 0;
    long long res = 0;
    int k = g;
    for (int i = 0; i < n; i++) {
        char ch = u[i];
        if (ch == 'A') {
            if (k > 0) {
                ch = 'I';
                k--;
            } else {
                ch = 'E';
            }
        }
        if (ch == 'I') {
            if (desk < x) {
                desk++;
                res++;
            }
        } else if (ch == 'E') {
            if (res < desk * s) {
                res++;
            }
        }
    }
    
    return res;
}

void solve() {
    int n, x;
    long long s;
    cin >> n >> x >> s;
    string u;
    cin >> u;
    
    int cnt_A = 0;
    for (char c : u) {
        if (c == 'A') cnt_A++;
    }
    int l = 0, r = cnt_A;
    while (l < r) {
        int mid = l + (r - l) / 2;
        if (calc(mid, n, x, s, u) >= calc(mid + 1, n, x, s, u)) {
            r = mid;
        } else { 
            l = mid + 1;
        }
    }
    
    cout << calc(l, n, x, s, u) << "\n";
}

int main() {
    
    int t;
    if (cin >> t) {
        while (t--) {
            solve();
        }
    }
    return 0;
}