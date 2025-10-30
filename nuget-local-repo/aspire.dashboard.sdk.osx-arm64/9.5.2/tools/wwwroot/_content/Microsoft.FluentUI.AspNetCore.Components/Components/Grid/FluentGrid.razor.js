function GetMediaQueries() {
    return [
        { id: 'xs', items: document._fluentGrid.mediaXS, query: '(max-width: 599.98px)' },
        { id: 'sm', items: document._fluentGrid.mediaSM, query: '(min-width: 600px) and (max-width: 959.98px)' },
        { id: 'md', items: document._fluentGrid.mediaMD, query: '(min-width: 960px) and (max-width: 1279.98px)' },
        { id: 'lg', items: document._fluentGrid.mediaLG, query: '(min-width: 1280px) and (max-width: 1919.98px)' },
        { id: 'xl', items: document._fluentGrid.mediaXL, query: '(min-width: 1920px) and (max-width: 2559.98px)' },
        { id: 'xxl', items: document._fluentGrid.mediaXXL, query: '(min-width: 2560px)' },
    ];
}

export function FluentGridInitialize(id, dotNetHelper) {

    // Create a single instance of the media queries
    if (!document._fluentGrid) {
        document._fluentGrid = {
            mediaXS: [],
            mediaSM: [],
            mediaMD: [],
            mediaLG: [],
            mediaXL: [],
            mediaXXL: [],
        }

        // Add event listeners for each media query
        GetMediaQueries().forEach((mediaQuery) => {
            window.matchMedia(mediaQuery.query)
                  .addEventListener('change', media => {
                      if (media.matches) {
                          mediaQuery.items.forEach((item) => {
                              item.dotNetHelper.invokeMethodAsync('FluentGrid_MediaChangedAsync', mediaQuery.id);
                          });
                      }
                  });
        });
    }

    // Add the item to each media query
    document._fluentGrid.mediaXS.push({ id: id, dotNetHelper: dotNetHelper });
    document._fluentGrid.mediaSM.push({ id: id, dotNetHelper: dotNetHelper });
    document._fluentGrid.mediaMD.push({ id: id, dotNetHelper: dotNetHelper });
    document._fluentGrid.mediaLG.push({ id: id, dotNetHelper: dotNetHelper });
    document._fluentGrid.mediaXL.push({ id: id, dotNetHelper: dotNetHelper });
    document._fluentGrid.mediaXXL.push({ id: id, dotNetHelper: dotNetHelper });

    // First check
    GetMediaQueries().forEach((mediaQuery) => {
        if (window.matchMedia(mediaQuery.query).matches) {
            dotNetHelper.invokeMethodAsync('FluentGrid_MediaChangedAsync', mediaQuery.id);
        }
    });
}

export function FluentGridCleanup(id) {
    if (document._fluentGrid) {
        RemoveItem(document._fluentGrid.mediaXS, id);
        RemoveItem(document._fluentGrid.mediaSM, id);
        RemoveItem(document._fluentGrid.mediaMD, id);
        RemoveItem(document._fluentGrid.mediaLG, id);
        RemoveItem(document._fluentGrid.mediaXL, id);
        RemoveItem(document._fluentGrid.mediaXXL, id);
    }
}

// Remove the Array item where item.id is found
function RemoveItem(array, id) {
    for (var i = array.length - 1; i >= 0; i--) {
        if (array[i].id === id) {
            array.splice(i, 1);
        }
    }
}

// SIG // Begin signature block
// SIG // MIIpGgYJKoZIhvcNAQcCoIIpCzCCKQcCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // togfSsofYQfAPiV/kkJXNiRIFKN7bZ+rmAHsm/E0N+eg
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
// SIG // TkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0xghqN
// SIG // MIIaiQIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSgw
// SIG // JgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5nIFBD
// SIG // QSAyMDExAhMzAAAErHYv/m7SjIRoAAAAAASsMA0GCWCG
// SIG // SAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgorBgEE
// SIG // AYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEEAYI3
// SIG // AgEVMC8GCSqGSIb3DQEJBDEiBCCrQtEIg3W0JYHmbk+I
// SIG // C8cCeEgnuLJCFWBKURPr34O3NTBCBgorBgEEAYI3AgEM
// SIG // MTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAYaHR0
// SIG // cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3DQEB
// SIG // AQUABIIBgBwB1R2+m7Kk+YZW3BrdoSFC83yXyB3HlKMg
// SIG // 2rLeGTcraNOp0WkUBetwW0QFWI4AGG3wE/wWqnHSiULT
// SIG // K0du+/hzVi7Zs9VeOJq4jQJTbl8xiveQ4PMXAncjfKKG
// SIG // DiaPz5VD7+VUqn0W+JOcMWsBNjZst6cGd2EsjxqS20m0
// SIG // JOKc/R4U5ZgXFVZdW73kXMe2lSbx3byihZkXJmFV4g0p
// SIG // nXs6XVBjJUNi0OkKc6dTl2Dzw324m/zD0j4F+0LcWOJH
// SIG // aKB5kav4rphJLy7aIlrCfkQZqvDk7hSIthsGqUibExZE
// SIG // Ku/CDKHeFY9tbvG3gpS0ktkWVwZe0sVm2l6qOASNfEBr
// SIG // gsldyySHcmEpWhJid0XJ7ZpGFtP9To67DgpPTYqsddjQ
// SIG // PRAqByI+iY+FLVtRpW9OhDSw72qsKePTZx4sB0GYGlJo
// SIG // nRUSBANfdfhy7P1M9xlgIjbiAG3rgCSY1pw5157YpH3i
// SIG // uZSlmZh1SonkusBzNibaY9SL8WYppVh0YkcmzqGCF5cw
// SIG // gheTBgorBgEEAYI3AwMBMYIXgzCCF38GCSqGSIb3DQEH
// SIG // AqCCF3AwghdsAgEDMQ8wDQYJYIZIAWUDBAIBBQAwggFS
// SIG // BgsqhkiG9w0BCRABBKCCAUEEggE9MIIBOQIBAQYKKwYB
// SIG // BAGEWQoDATAxMA0GCWCGSAFlAwQCAQUABCAoLkIy9DFP
// SIG // u9ZW9pJoRj1TE4etLJ/t6OzD0kUBn1G6PwIGaO/j9CPK
// SIG // GBMyMDI1MTAyMTAyMjU1NC43MDJaMASAAgH0oIHRpIHO
// SIG // MIHLMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSUwIwYDVQQLExxN
// SIG // aWNyb3NvZnQgQW1lcmljYSBPcGVyYXRpb25zMScwJQYD
// SIG // VQQLEx5uU2hpZWxkIFRTUyBFU046QTkzNS0wM0UwLUQ5
// SIG // NDcxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1w
// SIG // IFNlcnZpY2WgghHtMIIHIDCCBQigAwIBAgITMwAAAgy5
// SIG // ZOM1nOz0rgABAAACDDANBgkqhkiG9w0BAQsFADB8MQsw
// SIG // CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQ
// SIG // MA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDAeFw0yNTAxMzAx
// SIG // OTQzMDBaFw0yNjA0MjIxOTQzMDBaMIHLMQswCQYDVQQG
// SIG // EwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
// SIG // BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENv
// SIG // cnBvcmF0aW9uMSUwIwYDVQQLExxNaWNyb3NvZnQgQW1l
// SIG // cmljYSBPcGVyYXRpb25zMScwJQYDVQQLEx5uU2hpZWxk
// SIG // IFRTUyBFU046QTkzNS0wM0UwLUQ5NDcxJTAjBgNVBAMT
// SIG // HE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZpY2UwggIi
// SIG // MA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQDKAVYm
// SIG // PeRtga/U6jzqyqLD0MAool23gcBN58+Z/XskYwNJsZ+O
// SIG // +wVyQYl8dPTK1/BC2xAic1m+JvckqjVaQ32KmURsEZot
// SIG // irQY4PKVW+eXwRt3r6szgLuic6qoHlbXox/l0HJtgURk
// SIG // zDXWMkKmGSL7z8/crqcvmYqv8t/slAF4J+mpzb9tMFVm
// SIG // jwKXONVdRwg9Q3WaPZBC7Wvoi7PRIN2jgjSBnHYyAZSl
// SIG // stKNrpYb6+Gu6oSFkQzGpR65+QNDdkP4ufOf4PbOg3fb
// SIG // 4uGPjI8EPKlpwMwai1kQyX+fgcgCoV9J+o8MYYCZUet3
// SIG // kzhhwRzqh6LMeDjaXLP701SXXiXc2ZHzuDHbS/sZtJ36
// SIG // 27cVpClXEIUvg2xpr0rPlItHwtjo1PwMCpXYqnYKvX8a
// SIG // J8nawT9W8FUuuyZPG1852+q4jkVleKL7x+7el8ETehbd
// SIG // kwdhAXyXimaEzWetNNSmG/KfHAp9czwsL1vKr4Rgn+pI
// SIG // IkZHuomdf5e481K+xIWhLCPdpuV87EqGOK/jbhOnZEqw
// SIG // dvA0AlMaLfsmCemZmupejaYuEk05/6cCUxgF4zCnkJeY
// SIG // dMAP+9Z4kVh7tzRFsw/lZSl2D7EhIA6Knj6RffH2k7Yt
// SIG // SGSv86CShzfiXaz9y6sTu8SGqF6ObL/eu/DkivyVoCfU
// SIG // XWLjiSJsrS63D0EHHQIDAQABo4IBSTCCAUUwHQYDVR0O
// SIG // BBYEFHUORSH/sB/rQ/beD0l5VxQ706GIMB8GA1UdIwQY
// SIG // MBaAFJ+nFV0AXmJdg/Tl0mWnG1M1GelyMF8GA1UdHwRY
// SIG // MFYwVKBSoFCGTmh0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvY3JsL01pY3Jvc29mdCUyMFRpbWUtU3Rh
// SIG // bXAlMjBQQ0ElMjAyMDEwKDEpLmNybDBsBggrBgEFBQcB
// SIG // AQRgMF4wXAYIKwYBBQUHMAKGUGh0dHA6Ly93d3cubWlj
// SIG // cm9zb2Z0LmNvbS9wa2lvcHMvY2VydHMvTWljcm9zb2Z0
// SIG // JTIwVGltZS1TdGFtcCUyMFBDQSUyMDIwMTAoMSkuY3J0
// SIG // MAwGA1UdEwEB/wQCMAAwFgYDVR0lAQH/BAwwCgYIKwYB
// SIG // BQUHAwgwDgYDVR0PAQH/BAQDAgeAMA0GCSqGSIb3DQEB
// SIG // CwUAA4ICAQDZMPr4gVmwwf4GMB5ZfHSr34uhug6yzu4H
// SIG // UT+JWMZqz9uhLZBoX5CPjdKJzwAVvYoNuLmS0+9lA5S7
// SIG // 4rvKqd/u9vp88VGk6U7gMceatdqpKlbVRdn2ZfrMcpI4
// SIG // zOc6BtuYrzJV4cEs1YmX95uiAxaED34w02BnfuPZXA0e
// SIG // dsDBbd4ixFU8X/1J0DfIUk1YFYPOrmwmI2k16u6TcKO0
// SIG // YpRlwTdCq9vO0eEIER1SLmQNBzX9h2ccCvtgekOaBoIQ
// SIG // 3ZRai8Ds1f+wcKCPzD4qDX3xNgvLFiKoA6ZSG9S/yOrG
// SIG // aiSGIeDy5N9VQuqTNjryuAzjvf5W8AQp31hV1GbUDOkb
// SIG // Udd+zkJWKX4FmzeeN52EEbykoWcJ5V9M4DPGN5xpFqXy
// SIG // 9aO0+dR0UUYWuqeLhDyRnVeZcTEu0xgmo+pQHauFVASs
// SIG // VORMp8TF8dpesd+tqkkQ8VNvI20oOfnTfL+7ZgUMf7qN
// SIG // V0ll0Wo5nlr1CJva1bfk2Hc5BY1M9sd3blBkezyvJPn4
// SIG // j0bfOOrCYTwYsNsjiRl/WW18NOpiwqciwFlUNqtWCRMz
// SIG // C9r84YaUMQ82Bywk48d4uBon5ZA8pXXS7jwJTjJj5USe
// SIG // Rl9vjT98PDZyCFO2eFSOFdDdf6WBo/WZUA2hGZ0q+J7j
// SIG // 140fbXCfOUIm0j23HaAV0ckDS/nmC/oF1jCCB3EwggVZ
// SIG // oAMCAQICEzMAAAAVxedrngKbSZkAAAAAABUwDQYJKoZI
// SIG // hvcNAQELBQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAw
// SIG // BgNVBAMTKU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRl
// SIG // IEF1dGhvcml0eSAyMDEwMB4XDTIxMDkzMDE4MjIyNVoX
// SIG // DTMwMDkzMDE4MzIyNVowfDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAg
// SIG // UENBIDIwMTAwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAw
// SIG // ggIKAoICAQDk4aZM57RyIQt5osvXJHm9DtWC0/3unAcH
// SIG // 0qlsTnXIyjVX9gF/bErg4r25PhdgM/9cT8dm95VTcVri
// SIG // fkpa/rg2Z4VGIwy1jRPPdzLAEBjoYH1qUoNEt6aORmsH
// SIG // FPPFdvWGUNzBRMhxXFExN6AKOG6N7dcP2CZTfDlhAnrE
// SIG // qv1yaa8dq6z2Nr41JmTamDu6GnszrYBbfowQHJ1S/rbo
// SIG // YiXcag/PXfT+jlPP1uyFVk3v3byNpOORj7I5LFGc6XBp
// SIG // Dco2LXCOMcg1KL3jtIckw+DJj361VI/c+gVVmG1oO5pG
// SIG // ve2krnopN6zL64NF50ZuyjLVwIYwXE8s4mKyzbnijYjk
// SIG // lqwBSru+cakXW2dg3viSkR4dPf0gz3N9QZpGdc3EXzTd
// SIG // EonW/aUgfX782Z5F37ZyL9t9X4C626p+Nuw2TPYrbqgS
// SIG // Uei/BQOj0XOmTTd0lBw0gg/wEPK3Rxjtp+iZfD9M269e
// SIG // wvPV2HM9Q07BMzlMjgK8QmguEOqEUUbi0b1qGFphAXPK
// SIG // Z6Je1yh2AuIzGHLXpyDwwvoSCtdjbwzJNmSLW6CmgyFd
// SIG // XzB0kZSU2LlQ+QuJYfM2BjUYhEfb3BvR/bLUHMVr9lxS
// SIG // UV0S2yW6r1AFemzFER1y7435UsSFF5PAPBXbGjfHCBUY
// SIG // P3irRbb1Hode2o+eFnJpxq57t7c+auIurQIDAQABo4IB
// SIG // 3TCCAdkwEgYJKwYBBAGCNxUBBAUCAwEAATAjBgkrBgEE
// SIG // AYI3FQIEFgQUKqdS/mTEmr6CkTxGNSnPEP8vBO4wHQYD
// SIG // VR0OBBYEFJ+nFV0AXmJdg/Tl0mWnG1M1GelyMFwGA1Ud
// SIG // IARVMFMwUQYMKwYBBAGCN0yDfQEBMEEwPwYIKwYBBQUH
// SIG // AgEWM2h0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lv
// SIG // cHMvRG9jcy9SZXBvc2l0b3J5Lmh0bTATBgNVHSUEDDAK
// SIG // BggrBgEFBQcDCDAZBgkrBgEEAYI3FAIEDB4KAFMAdQBi
// SIG // AEMAQTALBgNVHQ8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB
// SIG // /zAfBgNVHSMEGDAWgBTV9lbLj+iiXGJo0T2UkFvXzpoY
// SIG // xDBWBgNVHR8ETzBNMEugSaBHhkVodHRwOi8vY3JsLm1p
// SIG // Y3Jvc29mdC5jb20vcGtpL2NybC9wcm9kdWN0cy9NaWNS
// SIG // b29DZXJBdXRfMjAxMC0wNi0yMy5jcmwwWgYIKwYBBQUH
// SIG // AQEETjBMMEoGCCsGAQUFBzAChj5odHRwOi8vd3d3Lm1p
// SIG // Y3Jvc29mdC5jb20vcGtpL2NlcnRzL01pY1Jvb0NlckF1
// SIG // dF8yMDEwLTA2LTIzLmNydDANBgkqhkiG9w0BAQsFAAOC
// SIG // AgEAnVV9/Cqt4SwfZwExJFvhnnJL/Klv6lwUtj5OR2R4
// SIG // sQaTlz0xM7U518JxNj/aZGx80HU5bbsPMeTCj/ts0aGU
// SIG // GCLu6WZnOlNN3Zi6th542DYunKmCVgADsAW+iehp4LoJ
// SIG // 7nvfam++Kctu2D9IdQHZGN5tggz1bSNU5HhTdSRXud2f
// SIG // 8449xvNo32X2pFaq95W2KFUn0CS9QKC/GbYSEhFdPSfg
// SIG // QJY4rPf5KYnDvBewVIVCs/wMnosZiefwC2qBwoEZQhlS
// SIG // dYo2wh3DYXMuLGt7bj8sCXgU6ZGyqVvfSaN0DLzskYDS
// SIG // PeZKPmY7T7uG+jIa2Zb0j/aRAfbOxnT99kxybxCrdTDF
// SIG // NLB62FD+CljdQDzHVG2dY3RILLFORy3BFARxv2T5JL5z
// SIG // bcqOCb2zAVdJVGTZc9d/HltEAY5aGZFrDZ+kKNxnGSgk
// SIG // ujhLmm77IVRrakURR6nxt67I6IleT53S0Ex2tVdUCbFp
// SIG // AUR+fKFhbHP+CrvsQWY9af3LwUFJfn6Tvsv4O+S3Fb+0
// SIG // zj6lMVGEvL8CwYKiexcdFYmNcP7ntdAoGokLjzbaukz5
// SIG // m/8K6TT4JDVnK+ANuOaMmdbhIurwJ0I9JZTmdHRbatGe
// SIG // Pu1+oDEzfbzL6Xu/OHBE0ZDxyKs6ijoIYn/ZcGNTTY3u
// SIG // gm2lBRDBcQZqELQdVTNYs6FwZvKhggNQMIICOAIBATCB
// SIG // +aGB0aSBzjCByzELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMG
// SIG // A1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9u
// SIG // czEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOkE5MzUt
// SIG // MDNFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloiMKAQEwBwYFKw4DAhoDFQDv
// SIG // u8hkhEMt5Z8Ldefls7z1LVU8pqCBgzCBgKR+MHwxCzAJ
// SIG // BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
// SIG // DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
// SIG // ZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29m
// SIG // dCBUaW1lLVN0YW1wIFBDQSAyMDEwMA0GCSqGSIb3DQEB
// SIG // CwUAAgUA7KD5bjAiGA8yMDI1MTAyMDE4MDk1MFoYDzIw
// SIG // MjUxMDIxMTgwOTUwWjB3MD0GCisGAQQBhFkKBAExLzAt
// SIG // MAoCBQDsoPluAgEAMAoCAQACAiJiAgH/MAcCAQACAhPh
// SIG // MAoCBQDsokruAgEAMDYGCisGAQQBhFkKBAIxKDAmMAwG
// SIG // CisGAQQBhFkKAwKgCjAIAgEAAgMHoSChCjAIAgEAAgMB
// SIG // hqAwDQYJKoZIhvcNAQELBQADggEBAHu1jj2rnnMBxVC5
// SIG // jRQcTtShe5ZqA2Xqz0+Q252/f5zbOCOAKbD2qyku72uD
// SIG // 5v3Xg6cJeRyTDTDcC06iCsjDwLSPuhKQB3yo/+E969Um
// SIG // 390LYdl89ZdFenth/Wd2SQ802awR/xz+WFylhbeucoyS
// SIG // qAx7kTWj/RBshadzIK5OPD8JDYR1N3z9P3VhBa7eHRUZ
// SIG // K6/pPOc1t545nZrcIdYfT0T86trPhzxa1T1gGzJSrbUC
// SIG // XoNJpYrRb0PDhh5MaOCHd1j967tiIvWtVkQCFy3VVaEr
// SIG // zTj3Fzi2qNEBRfYyuFh24cFGySZ3e/p+N4OTctIDsKDO
// SIG // FFpPS6In7YbBJA0OZaoxggQNMIIECQIBATCBkzB8MQsw
// SIG // CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQ
// SIG // MA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAgy5ZOM1
// SIG // nOz0rgABAAACDDANBglghkgBZQMEAgEFAKCCAUowGgYJ
// SIG // KoZIhvcNAQkDMQ0GCyqGSIb3DQEJEAEEMC8GCSqGSIb3
// SIG // DQEJBDEiBCB/D6m//pSAWOcqWrBAzr+w0oX7Fq4KQxO5
// SIG // u+oCLrZHrTCB+gYLKoZIhvcNAQkQAi8xgeowgecwgeQw
// SIG // gb0EINUo17cFMZN46MI5NfIAg9Ux5cO5xM9inre5riuO
// SIG // Z8ItMIGYMIGApH4wfDELMAkGA1UEBhMCVVMxEzARBgNV
// SIG // BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQx
// SIG // HjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEm
// SIG // MCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENB
// SIG // IDIwMTACEzMAAAIMuWTjNZzs9K4AAQAAAgwwIgQggWoe
// SIG // umq9olDWa3HeCw7HFu0IvC18LKcKWa20rWUOvLwwDQYJ
// SIG // KoZIhvcNAQELBQAEggIAkJrll8k47+0UM/7XgFQLlx0/
// SIG // H/UkjfKIPZlzfP+7q8692cimP0KeZsx05RWj/MFoSbyB
// SIG // +pE06PHUEZ9iDwmf1CBKTV9TdXL4phKM5og/oXkMGxGK
// SIG // l42uy8n0BSNfZYslki6zqkBUmT/SFvCKBO8n9gSsXhkc
// SIG // PJwEx7PCOzw39k8Z/eZz3NfQoHVsWj3/hFOcde3ogjrG
// SIG // nwmps40+VaOViW2i8NR6PFjtMAEYkWd7qAjWrBbZrkdc
// SIG // iwDE/bQAwFcecgUWMX06lBcBFbvpsbwKiQrI8ofY1LeS
// SIG // ogzbOp2SQ7WmxvHtoLorIQwlC5IElZ5TpDPkkHDXjeRX
// SIG // s7+tYW7OiP0EGToahEKLpSFU1FzH8mRjDaXGUHZoTtjh
// SIG // vG0WAVVGs9TPGgCYp77IhO2+dC2nYX9p4W+kYXJ5kQpp
// SIG // 36CxvXd6+eR82TRDuT44uhaddFkehGm0jaGOwpTGAT2s
// SIG // CIKYi+btCGTy5lS7hX4AMu8sa0LmeWpsdWsHnF6GJkhJ
// SIG // UPWUwc4u4u8IJLc1uqJ8PjEKzxKsbRxHnyO5nUIQC3lS
// SIG // CqaIpAbe7ctyxWF2qsBlWaPgl7G5Ih9uxQjhwf1DGEmi
// SIG // IAAh+YaYdo/4rHTJVWWFO7RA6PIf221Vbr3CmCtsmESz
// SIG // E4t0zimaEjy2xTVmuPSfi3BKzE0i6/sFHUidjAdpjeQ=
// SIG // End signature block
