import hljs from '/js/highlight-11.10.0.min.js'

function createObserver() {
    let highlightObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // If the data-content attribute changes, the content for this line's span has changed and so
            // we need to re-highlight it.
            if (mutation.attributeName === "data-content") {
                const target = mutation.target;
                const text = target.getAttribute("data-content");
                const language = target.getAttribute("data-language");
                target.innerHTML = hljs.highlight(language, text).value;
            }

            // On initial open, it's possible that the Virtualize component renders elements after its initial render. There is no hook
            // to know when this happens, so we need to observe the DOM for changes and highlight any new elements that are added.
            if (mutation.addedNodes.length > 0) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    let node = mutation.addedNodes[i];
                    if (node.classList && node.classList.contains("highlight-line")) {
                        hljs.highlightElement(node);
                    }
                }
            }
        })
    });

    return highlightObserver;
}

export function connectObserver(container) {
    if (!container) {
        return;
    }

    // It's possible either that
    // 1. The elements in the log container have already been rendered by the time this method is called, in which
    // case we need to highlight them immediately, or
    // 2. The elements in the log container have not been rendered yet, in which case we need to observe the container
    // for new elements that are added.
    if (container.highlightObserver) {
        container.highlightObserver.disconnect();
    }

    const existingElementsToHighlight = container.getElementsByClassName("highlight-line");
    for (let i = 0; i < existingElementsToHighlight.length; i++) {
        hljs.highlightElement(existingElementsToHighlight[i]);
    }

    var highlightObserver = createObserver();
    highlightObserver.observe(container, {
        childList: true,
        subtree: true,
        attributes: true
    });
    container.highlightObserver = highlightObserver;
}

export function disconnectObserver(container) {
    if (!container) {
        return;
    }

    var highlightObserver = container.highlightObserver;
    if (!highlightObserver) {
        return;
    }

    highlightObserver.disconnect();
    container.highlightObserver = null;
}

// SIG // Begin signature block
// SIG // MIIpMAYJKoZIhvcNAQcCoIIpITCCKR0CAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // 9x76Ix9pGD40Vu0TSBuNCS7rSNRRp0TDcYjt86e4ND2g
// SIG // gg3lMIIGYzCCBEugAwIBAgITMwAABKx2L/5u0oyEaAAA
// SIG // AAAErDANBgkqhkiG9w0BAQwFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTI1MDkxODE3NTg1OVoX
// SIG // DTI2MDcwNjE3NTg1OVowYzELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjENMAsGA1UEAxMELk5FVDCCAaIwDQYJKoZIhvcNAQEB
// SIG // BQADggGPADCCAYoCggGBALuFEy75KfVcG2h5jV0iKaYZ
// SIG // VCj66T6iHA4wmiIfEEj395MLfCL0DzfllnBDCG6IYYOB
// SIG // x6S2NQWioqOnxW5sVtKAV/XFEo9jUPdD3KrjYaSJ2RmD
// SIG // VaG7DfqYuFYGaAoiOu8S2AABRVOJDBXccisvpm7Rj6eU
// SIG // N7KAhkhMIpCYr3g4e8DyUY4oD+XeEavEOTNM+u+zrq/u
// SIG // 2hBfE5lUFuPLX6q5/Mfvd5b3rBCQe55Cw0Cr5sxjkcnZ
// SIG // asgg6NpWaAXzi/fZYMVvZKQMbpvBUVl7e38xtQbjn+0j
// SIG // Pxg8EZDQVpDsnuIX00BwJuVqPJ/+fsTyGiXc4UjVZjFP
// SIG // fAZAzyQQzUiZz3hcoj63M4oc5Ppwa24Xo/h3d5LNl8Wc
// SIG // duJ5zB6B1JdcW8nnX2OTKJV7RkEufA8z1/VdSuet3LYK
// SIG // qvUDls+twfp6+Pp7gKK5PVV+NmxM1CwsJrVExkL0Atry
// SIG // AoCEk33xKV4YDdhJkfyEWOe4XfKX8SdoIiWjzc2Ji4h0
// SIG // GKMMnQIDAQABo4IBczCCAW8wHwYDVR0lBBgwFgYKKwYB
// SIG // BAGCN0wIAQYIKwYBBQUHAwMwHQYDVR0OBBYEFLt6EqlH
// SIG // MQADV5J7JQApJK7bkFLXMEUGA1UdEQQ+MDykOjA4MR4w
// SIG // HAYDVQQLExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xFjAU
// SIG // BgNVBAUTDTQ2NDIyMys1MDYwODEwHwYDVR0jBBgwFoAU
// SIG // SG5k5VAF04KqFzc3IrVtqMp1ApUwVAYDVR0fBE0wSzBJ
// SIG // oEegRYZDaHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3Br
// SIG // aW9wcy9jcmwvTWljQ29kU2lnUENBMjAxMV8yMDExLTA3
// SIG // LTA4LmNybDBhBggrBgEFBQcBAQRVMFMwUQYIKwYBBQUH
// SIG // MAKGRWh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lv
// SIG // cHMvY2VydHMvTWljQ29kU2lnUENBMjAxMV8yMDExLTA3
// SIG // LTA4LmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEB
// SIG // DAUAA4ICAQBZqC3dc2aDYyQyTf7Rd+JF0U4aF6+ry5PT
// SIG // FMP3q9NQxswxYjWkDaA+YQuOCHXFvneBMFKiDrsV26QJ
// SIG // fDoraWOmIqQAqBUxKmCY+94Yhq2HtQqvnbdCwrKBwbzu
// SIG // Uiyb33D60UBFuqifb6bVTiyo95MYu5GcuYj9jcAmegGg
// SIG // sshKDL0HS6GyDG5iBNiFtdOCm8Q3PiCwLkU+gP8qeke5
// SIG // McDHjvR/L3KBdcWPhEpG/HEK6RG9Q75JZAtQguX8iiZi
// SIG // G9Ei+yt/iiVBnuaiDjEOfi8x+tmN0teAwvzpj2xPjTAS
// SIG // tEUCSjCZWmFKkxsrYmNpNQtG3CttnHxWzinAuqbogvSr
// SIG // 5H4MtirS3R2gZQoVly+7S4h5jvf7MyH810Q9wy7hhBLm
// SIG // C+whhg3WmAoBUvDzBKM9f4TJZvSzxlq2KlhR1i+x91PO
// SIG // B4FW+YPTrKlJ4vaClHJGKOGNbH9M8ktR8Yh5o1CFRrce
// SIG // NiQ+LjAvHofJx9zGMbR82vFF3rEEIp1dfDD6KirePgte
// SIG // jlLLryV/rQ7vY/RCHXzNlb2VhL7lcpHqFZSQu9QqKG79
// SIG // TPBEN+3yggx6z4SFg6nrQ7UdQyz7U/rVggORT+Z6x+Iq
// SIG // swjkqme+BRoppUW77TYxOvcz8Z+wXvSCQIbLc4DT+wTo
// SIG // 4eyD9FI6OFi3qyEKz0Bq92R6w4kh2YHgLzCCB3owggVi
// SIG // oAMCAQICCmEOkNIAAAAAAAMwDQYJKoZIhvcNAQELBQAw
// SIG // gYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMTKU1p
// SIG // Y3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhvcml0
// SIG // eSAyMDExMB4XDTExMDcwODIwNTkwOVoXDTI2MDcwODIx
// SIG // MDkwOVowfjELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldh
// SIG // c2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNV
// SIG // BAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYGA1UE
// SIG // AxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0EgMjAx
// SIG // MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIB
// SIG // AKvw+nIQHC6t2G6qghBNNLrytlghn0IbKmvpWlCquAY4
// SIG // GgRJun/DDB7dN2vGEtgL8DjCmQawyDnVARQxQtOJDXlk
// SIG // h36UYCRsr55JnOloXtLfm1OyCizDr9mpK656Ca/XllnK
// SIG // YBoF6WZ26DJSJhIv56sIUM+zRLdd2MQuA3WraPPLbfM6
// SIG // XKEW9Ea64DhkrG5kNXimoGMPLdNAk/jj3gcN1Vx5pUkp
// SIG // 5w2+oBN3vpQ97/vjK1oQH01WKKJ6cuASOrdJXtjt7UOR
// SIG // g9l7snuGG9k+sYxd6IlPhBryoS9Z5JA7La4zWMW3Pv4y
// SIG // 07MDPbGyr5I4ftKdgCz1TlaRITUlwzluZH9TupwPrRkj
// SIG // hMv0ugOGjfdf8NBSv4yUh7zAIXQlXxgotswnKDglmDlK
// SIG // Ns98sZKuHCOnqWbsYR9q4ShJnV+I4iVd0yFLPlLEtVc/
// SIG // JAPw0XpbL9Uj43BdD1FGd7P4AOG8rAKCX9vAFbO9G9RV
// SIG // S+c5oQ/pI0m8GLhEfEXkwcNyeuBy5yTfv0aZxe/CHFfb
// SIG // g43sTUkwp6uO3+xbn6/83bBm4sGXgXvt1u1L50kppxMo
// SIG // pqd9Z4DmimJ4X7IvhNdXnFy/dygo8e1twyiPLI9AN0/B
// SIG // 4YVEicQJTMXUpUMvdJX3bvh4IFgsE11glZo+TzOE2rCI
// SIG // F96eTvSWsLxGoGyY0uDWiIwLAgMBAAGjggHtMIIB6TAQ
// SIG // BgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4EFgQUSG5k5VAF
// SIG // 04KqFzc3IrVtqMp1ApUwGQYJKwYBBAGCNxQCBAweCgBT
// SIG // AHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB/wQF
// SIG // MAMBAf8wHwYDVR0jBBgwFoAUci06AjGQQ7kUBU7h6qfH
// SIG // MdEjiTQwWgYDVR0fBFMwUTBPoE2gS4ZJaHR0cDovL2Ny
// SIG // bC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVjdHMv
// SIG // TWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNybDBe
// SIG // BggrBgEFBQcBAQRSMFAwTgYIKwYBBQUHMAKGQmh0dHA6
// SIG // Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWlj
// SIG // Um9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNydDCBnwYD
// SIG // VR0gBIGXMIGUMIGRBgkrBgEEAYI3LgMwgYMwPwYIKwYB
// SIG // BQUHAgEWM2h0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9w
// SIG // a2lvcHMvZG9jcy9wcmltYXJ5Y3BzLmh0bTBABggrBgEF
// SIG // BQcCAjA0HjIgHQBMAGUAZwBhAGwAXwBwAG8AbABpAGMA
// SIG // eQBfAHMAdABhAHQAZQBtAGUAbgB0AC4gHTANBgkqhkiG
// SIG // 9w0BAQsFAAOCAgEAZ/KGpZjgVHkaLtPYdGcimwuWEeFj
// SIG // kplCln3SeQyQwWVfLiw++MNy0W2D/r4/6ArKO79HqaPz
// SIG // adtjvyI1pZddZYSQfYtGUFXYDJJ80hpLHPM8QotS0LD9
// SIG // a+M+By4pm+Y9G6XUtR13lDni6WTJRD14eiPzE32mkHSD
// SIG // jfTLJgJGKsKKELukqQUMm+1o+mgulaAqPyprWEljHwlp
// SIG // blqYluSD9MCP80Yr3vw70L01724lruWvJ+3Q3fMOr5ko
// SIG // l5hNDj0L8giJ1h/DMhji8MUtzluetEk5CsYKwsatruWy
// SIG // 2dsViFFFWDgycScaf7H0J/jeLDogaZiyWYlobm+nt3TD
// SIG // QAUGpgEqKD6CPxNNZgvAs0314Y9/HG8VfUWnduVAKmWj
// SIG // w11SYobDHWM2l4bf2vP48hahmifhzaWX0O5dY0HjWwec
// SIG // hz4GdwbRBrF1HxS+YWG18NzGGwS+30HHDiju3mUv7Jf2
// SIG // oVyW2ADWoUa9WfOXpQlLSBCZgB/QACnFsZulP0V3HjXG
// SIG // 0qKin3p6IvpIlR+r+0cjgPWe+L9rt0uX4ut1eBrs6jeZ
// SIG // eRhL/9azI2h15q/6/IvrC4DqaTuv/DDtBEyO3991bWOR
// SIG // PdGdVk5Pv4BXIqF4ETIheu9BCrE/+6jMpF3BoYibV3FW
// SIG // TkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0xghqj
// SIG // MIIanwIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSgw
// SIG // JgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5nIFBD
// SIG // QSAyMDExAhMzAAAErHYv/m7SjIRoAAAAAASsMA0GCWCG
// SIG // SAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgorBgEE
// SIG // AYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEEAYI3
// SIG // AgEVMC8GCSqGSIb3DQEJBDEiBCC6HMUmn1pKO7/8+fYf
// SIG // WkcKZNsMJvW+p2n6jlyeL7QgAjBCBgorBgEEAYI3AgEM
// SIG // MTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAYaHR0
// SIG // cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3DQEB
// SIG // AQUABIIBgBLefOa8v5sh/MQZo7YOZkZVkVZ2axQ135I4
// SIG // b6QSEgxKpijbQ8gXD6O38cq+92SwrbFbeCBfeyO/aOId
// SIG // OJgfKiGWlQXeIrADXJxSvytLdBX7wla7k8/Z3Y9AWvh0
// SIG // /tjZ6UV8iQ2IyUaXhnCzucXpaC5eaF5SCf4DvbD32Ord
// SIG // xNGP97XQ8TlfUwVD1781EQpP6GbipsNdgJ5TPlmBCe+V
// SIG // O2XK1CrvjHZcUa/bc2yIfL3BagRqx2Yec91Tp56Kihuu
// SIG // cjkldWu/ikUTashS20s+3V6ny7gFaitNqc8fviD0iCJb
// SIG // whHXtdBmsB86UdGB8i8Oxu0+FbWDe25xR9D8eA7eG1Zx
// SIG // dUd6DLJyWNY6iEm2f9NYuC8nwadzdj6+vUdxDE1L8OIf
// SIG // fCcQEhRfpuLLgm31qgg8lilwMal66iygiGzYEV7bQKOV
// SIG // 1c10qAUweUG8AQ1xaquDYnKmdjSVV+Op/BBj8UQ9adQO
// SIG // Zu4tVMli/Jv875xzL4ur06DF9TaliYYu9G1YUKGCF60w
// SIG // ghepBgorBgEEAYI3AwMBMYIXmTCCF5UGCSqGSIb3DQEH
// SIG // AqCCF4YwgheCAgEDMQ8wDQYJYIZIAWUDBAIBBQAwggFa
// SIG // BgsqhkiG9w0BCRABBKCCAUkEggFFMIIBQQIBAQYKKwYB
// SIG // BAGEWQoDATAxMA0GCWCGSAFlAwQCAQUABCADEV0yTQiM
// SIG // iRWfZrw5anBl0jyMQdkywl5zQFskurT6jAIGaPKhdN7T
// SIG // GBMyMDI1MTAyMTAyMjcxMC4yNjJaMASAAgH0oIHZpIHW
// SIG // MIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQLEyRN
// SIG // aWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0
// SIG // ZWQxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVTTjo2RjFB
// SIG // LTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRp
// SIG // bWUtU3RhbXAgU2VydmljZaCCEfswggcoMIIFEKADAgEC
// SIG // AhMzAAACHAlVFdfDWQfRAAEAAAIcMA0GCSqGSIb3DQEB
// SIG // CwUAMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMT
// SIG // HU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwMB4X
// SIG // DTI1MDgxNDE4NDgzMVoXDTI2MTExMzE4NDgzMVowgdMx
// SIG // CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9u
// SIG // MRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
// SIG // b3NvZnQgQ29ycG9yYXRpb24xLTArBgNVBAsTJE1pY3Jv
// SIG // c29mdCBJcmVsYW5kIE9wZXJhdGlvbnMgTGltaXRlZDEn
// SIG // MCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjZGMUEtMDVF
// SIG // MC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBTZXJ2aWNlMIICIjANBgkqhkiG9w0BAQEFAAOC
// SIG // Ag8AMIICCgKCAgEAow0xEAUaFIyyLIXeFzeI8IKyBON2
// SIG // u0Dr02ISE5p9G5CUXfnFu2S0E1gWCMvDWpopX6lRxjmg
// SIG // nqaL3BtnWlBVTo8xUNRZu23ie4YBMAJB7Ut6mnqnHVwv
// SIG // DJxGO4TD3SnrCd+yg35B9QFejq3o4+OByvXjynaypZyu
// SIG // kcQaLsKQvoxE8ElHH7zcOXEJWmU3rnXzaW/S4SH3OPho
// SIG // UbTTcy6nUgKx5pRWiQ24UEPLYzcxGJjqjkz+GiCWGPFH
// SIG // DMdW86laWvmCslouQPsN2eBk8dxJcEZmW4l6p4TthoXc
// SIG // fexEA9YdYaMz10aMhZNpdsNaDtDQUMDEC3k1D1My69MX
// SIG // SPlUmD9xFyDlkXiVa7BCEp3XcVtqTgzHGwr28JD6oE7z
// SIG // EPYeuZOiuCBXTZSo/wk3tbDlsESbIPV6inYqrzxiMYql
// SIG // xfCdzC3Cimh9/NT/Lk9/aU+Iyyc9b3OaT0dZ8wgLaVDC
// SIG // GELRMrqyImdFHv0MudctzW/kPsV3Ja9ufpKWujEiN3CW
// SIG // //X8hFa9j5ImNeQzcMit3MoSaoGwnbiZJX1IyibIphlq
// SIG // ccXFk4oTTSOQBsAUw8U0gwOnM5UJD8mBUBd65Np6NBkx
// SIG // 2cviJ4I34GyXFCWyy5Ft1QsBYyVfAG3KOhCfPHQf8lQz
// SIG // JvLr57YW0bD/xVs4Ag4gTS6KZNyFEfX9jFdRlr0CAwEA
// SIG // AaOCAUkwggFFMB0GA1UdDgQWBBRa3mOCzB8u7zpvDh8M
// SIG // GKVYLCk7ZDAfBgNVHSMEGDAWgBSfpxVdAF5iXYP05dJl
// SIG // pxtTNRnpcjBfBgNVHR8EWDBWMFSgUqBQhk5odHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NybC9NaWNy
// SIG // b3NvZnQlMjBUaW1lLVN0YW1wJTIwUENBJTIwMjAxMCgx
// SIG // KS5jcmwwbAYIKwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAC
// SIG // hlBodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3Bz
// SIG // L2NlcnRzL01pY3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQ
// SIG // Q0ElMjAyMDEwKDEpLmNydDAMBgNVHRMBAf8EAjAAMBYG
// SIG // A1UdJQEB/wQMMAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQE
// SIG // AwIHgDANBgkqhkiG9w0BAQsFAAOCAgEAklb6w/deaid3
// SIG // BujQCtWFBe0n9pkyRy+yyWEg70iDwoJ5u0e0O+4GerNz
// SIG // dZb1zTPsHJ8EGMyo1K7ytL21+pmdFMTl19PC8OJ5Y2p+
// SIG // XKUQy2dD+hggRMmJgDQsgbOCxHYeO+jg4t+vg61wUrov
// SIG // zzLkH3z0PJXXvoNuBj9Lda9CiNMd60451Kube99ArSf6
// SIG // ZMj3t0p4rFbgSazDs+8TJ+8KA5GVaYjPHj9rlMuI3Wjo
// SIG // hEc9apnQ6hMjMck3jlHZIwluVYeUQE0qjmApfMtTAEzb
// SIG // MUdY8sLTunL1GkbDSeKn9O7llBGnNtyM1uM9Mdv1VyWh
// SIG // 0z/IriQKIjntqqGyoF0HvDHOFZCyUDBPLflyiu7Y1zQ/
// SIG // sPounsb96aBfQdq3h3LOn6t+m9EnNz/G6MzzWvpJk6Yg
// SIG // THTIqeQN/F/XpiPvbfek3nq/PYbL3au+kBfRUHiCFXSv
// SIG // t6lor0HC626vUmz9ZNPOxwEWLuccomxsy3JwWH79vsM/
// SIG // 7ARqoG5h6d6NahfaOuRP4XI9xtdH3Pa/NCLyQjxKXyLx
// SIG // zwQzjddkX2EpTJnlypuhPmEdea59Uz2E303LxyXSnKBv
// SIG // GsAnyWYAfnejr3YAiL9YrN2l2dn198RpA4DCm9QtZYiw
// SIG // C0q2fuUvui34PfPIUZByf7wHuuWu50hY9WLx1kOMI8xy
// SIG // o7AI6TaNrnIwggdxMIIFWaADAgECAhMzAAAAFcXna54C
// SIG // m0mZAAAAAAAVMA0GCSqGSIb3DQEBCwUAMIGIMQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMTIwMAYDVQQDEylNaWNyb3NvZnQg
// SIG // Um9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkgMjAxMDAe
// SIG // Fw0yMTA5MzAxODIyMjVaFw0zMDA5MzAxODMyMjVaMHwx
// SIG // CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9u
// SIG // MRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
// SIG // b3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jv
// SIG // c29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwMIICIjANBgkq
// SIG // hkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA5OGmTOe0ciEL
// SIG // eaLL1yR5vQ7VgtP97pwHB9KpbE51yMo1V/YBf2xK4OK9
// SIG // uT4XYDP/XE/HZveVU3Fa4n5KWv64NmeFRiMMtY0Tz3cy
// SIG // wBAY6GB9alKDRLemjkZrBxTzxXb1hlDcwUTIcVxRMTeg
// SIG // Cjhuje3XD9gmU3w5YQJ6xKr9cmmvHaus9ja+NSZk2pg7
// SIG // uhp7M62AW36MEBydUv626GIl3GoPz130/o5Tz9bshVZN
// SIG // 7928jaTjkY+yOSxRnOlwaQ3KNi1wjjHINSi947SHJMPg
// SIG // yY9+tVSP3PoFVZhtaDuaRr3tpK56KTesy+uDRedGbsoy
// SIG // 1cCGMFxPLOJiss254o2I5JasAUq7vnGpF1tnYN74kpEe
// SIG // HT39IM9zfUGaRnXNxF803RKJ1v2lIH1+/NmeRd+2ci/b
// SIG // fV+AutuqfjbsNkz2K26oElHovwUDo9Fzpk03dJQcNIIP
// SIG // 8BDyt0cY7afomXw/TNuvXsLz1dhzPUNOwTM5TI4CvEJo
// SIG // LhDqhFFG4tG9ahhaYQFzymeiXtcodgLiMxhy16cg8ML6
// SIG // EgrXY28MyTZki1ugpoMhXV8wdJGUlNi5UPkLiWHzNgY1
// SIG // GIRH29wb0f2y1BzFa/ZcUlFdEtsluq9QBXpsxREdcu+N
// SIG // +VLEhReTwDwV2xo3xwgVGD94q0W29R6HXtqPnhZyacau
// SIG // e7e3PmriLq0CAwEAAaOCAd0wggHZMBIGCSsGAQQBgjcV
// SIG // AQQFAgMBAAEwIwYJKwYBBAGCNxUCBBYEFCqnUv5kxJq+
// SIG // gpE8RjUpzxD/LwTuMB0GA1UdDgQWBBSfpxVdAF5iXYP0
// SIG // 5dJlpxtTNRnpcjBcBgNVHSAEVTBTMFEGDCsGAQQBgjdM
// SIG // g30BATBBMD8GCCsGAQUFBwIBFjNodHRwOi8vd3d3Lm1p
// SIG // Y3Jvc29mdC5jb20vcGtpb3BzL0RvY3MvUmVwb3NpdG9y
// SIG // eS5odG0wEwYDVR0lBAwwCgYIKwYBBQUHAwgwGQYJKwYB
// SIG // BAGCNxQCBAweCgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGG
// SIG // MA8GA1UdEwEB/wQFMAMBAf8wHwYDVR0jBBgwFoAU1fZW
// SIG // y4/oolxiaNE9lJBb186aGMQwVgYDVR0fBE8wTTBLoEmg
// SIG // R4ZFaHR0cDovL2NybC5taWNyb3NvZnQuY29tL3BraS9j
// SIG // cmwvcHJvZHVjdHMvTWljUm9vQ2VyQXV0XzIwMTAtMDYt
// SIG // MjMuY3JsMFoGCCsGAQUFBwEBBE4wTDBKBggrBgEFBQcw
// SIG // AoY+aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraS9j
// SIG // ZXJ0cy9NaWNSb29DZXJBdXRfMjAxMC0wNi0yMy5jcnQw
// SIG // DQYJKoZIhvcNAQELBQADggIBAJ1VffwqreEsH2cBMSRb
// SIG // 4Z5yS/ypb+pcFLY+TkdkeLEGk5c9MTO1OdfCcTY/2mRs
// SIG // fNB1OW27DzHkwo/7bNGhlBgi7ulmZzpTTd2YurYeeNg2
// SIG // LpypglYAA7AFvonoaeC6Ce5732pvvinLbtg/SHUB2Rje
// SIG // bYIM9W0jVOR4U3UkV7ndn/OOPcbzaN9l9qRWqveVtihV
// SIG // J9AkvUCgvxm2EhIRXT0n4ECWOKz3+SmJw7wXsFSFQrP8
// SIG // DJ6LGYnn8AtqgcKBGUIZUnWKNsIdw2FzLixre24/LAl4
// SIG // FOmRsqlb30mjdAy87JGA0j3mSj5mO0+7hvoyGtmW9I/2
// SIG // kQH2zsZ0/fZMcm8Qq3UwxTSwethQ/gpY3UA8x1RtnWN0
// SIG // SCyxTkctwRQEcb9k+SS+c23Kjgm9swFXSVRk2XPXfx5b
// SIG // RAGOWhmRaw2fpCjcZxkoJLo4S5pu+yFUa2pFEUep8beu
// SIG // yOiJXk+d0tBMdrVXVAmxaQFEfnyhYWxz/gq77EFmPWn9
// SIG // y8FBSX5+k77L+DvktxW/tM4+pTFRhLy/AsGConsXHRWJ
// SIG // jXD+57XQKBqJC4822rpM+Zv/Cuk0+CQ1ZyvgDbjmjJnW
// SIG // 4SLq8CdCPSWU5nR0W2rRnj7tfqAxM328y+l7vzhwRNGQ
// SIG // 8cirOoo6CGJ/2XBjU02N7oJtpQUQwXEGahC0HVUzWLOh
// SIG // cGbyoYIDVjCCAj4CAQEwggEBoYHZpIHWMIHTMQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMS0wKwYDVQQLEyRNaWNyb3NvZnQg
// SIG // SXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQxJzAlBgNV
// SIG // BAsTHm5TaGllbGQgVFNTIEVTTjo2RjFBLTA1RTAtRDk0
// SIG // NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAg
// SIG // U2VydmljZaIjCgEBMAcGBSsOAwIaAxUAWmTiA01u5mxq
// SIG // /nVxiRJLMOskVGeggYMwgYCkfjB8MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0BAQsFAAIFAOyh
// SIG // FDQwIhgPMjAyNTEwMjAyMDA0MDRaGA8yMDI1MTAyMTIw
// SIG // MDQwNFowdDA6BgorBgEEAYRZCgQBMSwwKjAKAgUA7KEU
// SIG // NAIBADAHAgEAAgIByjAHAgEAAgISzjAKAgUA7KJltAIB
// SIG // ADA2BgorBgEEAYRZCgQCMSgwJjAMBgorBgEEAYRZCgMC
// SIG // oAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0GCSqGSIb3
// SIG // DQEBCwUAA4IBAQBlFGzf3uQxmyjEfukfMzuWJuXxEoMR
// SIG // HAz7XKSByCs/nCP/fFBnXDj2u1CDQddK85+LaIj1gpnl
// SIG // v5f57Kcj48UlVz6Xa7/VmEx/6k39rBdvgYSvN9bkd/8y
// SIG // tc2d1Cx4dacq7zA5fGv3C4vXHqom719r9aPBUcBvx7C9
// SIG // EFfZ87VinHRkm3NIlfHDnn1UKlCEjQWOMt2FI5BQiqFk
// SIG // EMCGeGsZNo6L51loaWGaBEN2HxZEYhy4hTnJH6PhyfRu
// SIG // PrcJGGdLLRLQGzhC2oZnS0xAn5hMVOZrBSRboJyiEBB3
// SIG // S3Qn7HQQ8OtLf8Xe7t9N/rYStFposzqXhxR7GJdD1vfb
// SIG // Tq92MYIEDTCCBAkCAQEwgZMwfDELMAkGA1UEBhMCVVMx
// SIG // EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1Jl
// SIG // ZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3Jh
// SIG // dGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3Rh
// SIG // bXAgUENBIDIwMTACEzMAAAIcCVUV18NZB9EAAQAAAhww
// SIG // DQYJYIZIAWUDBAIBBQCgggFKMBoGCSqGSIb3DQEJAzEN
// SIG // BgsqhkiG9w0BCRABBDAvBgkqhkiG9w0BCQQxIgQggdvF
// SIG // 6QqgfomoMWJZKXmBG2jmS6ShiigGE1rw8PWeMbAwgfoG
// SIG // CyqGSIb3DQEJEAIvMYHqMIHnMIHkMIG9BCCgIGkmNhdo
// SIG // 7+KE7dWhI+E2Ctx2RLWoYvvJodCIciHHaDCBmDCBgKR+
// SIG // MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1p
// SIG // Y3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMzAAAC
// SIG // HAlVFdfDWQfRAAEAAAIcMCIEIOPP7OiOZZf6ZFmF3rkx
// SIG // XzeNG+DTxaVTr4PYLFbGsYDQMA0GCSqGSIb3DQEBCwUA
// SIG // BIICADnibr359dKPvcsikQXVdHeKAtiwLDihwdMEiHQJ
// SIG // nhYK4JzEvt7VVRkAmq91N47UeNrfGqb3Eco8P2qOJFXB
// SIG // ki2K8tRdQrJtAXDdGlR5SuUcClp+s/Kp7M09h2OA8W9c
// SIG // +x6VpSATLYAaRjTMwK0wsFbK8P5Qu8CjnW62S3FbrxmT
// SIG // fBJkGTQPJKjaQnZy9oO5ACJYc9z0cuSQ0Had/c1jRohP
// SIG // 4PWeqIz8ke/svGDMgFW+kqxloIalWUatwfOoOunguKUJ
// SIG // +iC/+uTu0xVklUZmGkHJRJTIhEcfyIFi0xFu4vpQ3Tmr
// SIG // DTUoG7w6RZAmRdFg6tDU/miUdOdOmVHfLRujcewh8k10
// SIG // SXdON9Z3PewiWttuytWNNq/fxLl/IsR7c7E5zvLBDJCQ
// SIG // 8/enpvH71POx6CvEil/VVeAKH8ZAvfmBa9vSpmLNpO9r
// SIG // DPEcbLYAjeC27D4o+jIflfoyUVNxOC7ZptY55DmBBGgK
// SIG // V06+gBipsXQHQR2qIUZ/0AFfFxokjH41X/B03MJtdRp0
// SIG // rmBM0lrzZxPBNCFCJQ8eRyAkxQ3+2mcp0cQgCZci0fTH
// SIG // Tw5XZsyZ3JyUn3A0ICTS4RBqGyRwlwwPRNIRaAJ1Awpo
// SIG // LuAYB9CTjeV6R4249VlVC/Bqn6zSEKOyKMe36SFbyJiA
// SIG // +Ksi4rwrTU4wWHWstKcMqNJQ2XVH
// SIG // End signature block
