export function onLoad() {
    const mql = window.matchMedia("(max-width: 600px)");

    for (let expander of document.getElementsByClassName("expander")) {
        if (expander) {
            const origStyle = expander.parentElement.style.cssText;
            expander.addEventListener('click', (ev) => toggleMenuExpandedAsync(expander, origStyle, ev));
            expander.addEventListener('keydown', (ev) => handleMenuExpanderKeyDownAsync(expander, origStyle, ev));

            mql.onchange = (e) => {
                if (e.matches) {
                    setMenuExpanded(expander, origStyle, true)
                }
            };
        }
    }
    for (let element of document.getElementsByClassName("fluent-nav-group")) {
        attachEventHandlers(element);
    }
}
export function onUpdate() {
    
}

export function onDispose() {
    for (let expander of document.getElementsByClassName("expander")) {
        if (expander) {
            expander.removeEventListener('click', toggleMenuExpandedAsync);
            expander.removeEventListener('keydown', handleMenuExpanderKeyDownAsync);
        }
    }
    for (let element of document.getElementsByClassName("fluent-nav-group")) {
        detachEventHandlers(element);
    }
}

function attachEventHandlers(element) {
    let navlink = element.getElementsByClassName("fluent-nav-link")[0];
    if (!navlink) {
        return;
    }
    if (!navlink.href) {
        navlink.addEventListener('click', () => toggleGroupExpandedAsync(element));
    }
    navlink.addEventListener('keydown', (ev) => handleExpanderKeyDownAsync(element, ev));

    let expandCollapseButton = element.getElementsByClassName("expand-collapse-button")[0];
    if (!expandCollapseButton) {
        return;
    }
    expandCollapseButton.addEventListener('click', (ev) => toggleGroupExpandedAsync(element, navlink, ev));
}

function detachEventHandlers(element) {
    let navlink = element.getElementsByClassName("fluent-nav-link")[0];
    if (!navlink) {
        return;
    }
    if (!navlink.href) {
        navlink.removeEventListener('click', toggleGroupExpandedAsync);
    }
    navlink.removeEventListener('keydown', handleExpanderKeyDownAsync);

    let expandCollapseButton = element.getElementsByClassName("expand-collapse-button")[0];
    expandCollapseButton.removeEventListener('click', toggleGroupExpandedAsync);
}

function toggleMenuExpandedAsync(element, orig, event) {

    let parent = element.parentElement;
    if (!parent.classList.contains('collapsed')) {
        parent.classList.add('collapsed');
        parent.style.width = '40px';
        parent.style.minWidth = '40px';
        parent.ariaExpanded = 'false';
        element.ariaExpanded = 'false';
    }
    else {
        parent.classList.remove('collapsed');
        parent.style.cssText = orig;
        parent.ariaExpanded = 'true';
        element.ariaExpanded = 'true';
    }
    event?.stopPropagation();
}

function toggleGroupExpandedAsync(element, navlink, event) {
    if (navlink && navlink.href) {
        event.preventDefault();
    }
    setExpanded(element, !element.classList.contains('expanded'));
    event?.stopPropagation();
}

function handleExpanderKeyDownAsync(element, event) {
    switch (event.code) {
        case "NumpadEnter":
        case "Enter":
            toggleGroupExpandedAsync(element, null, event);
            break;
        case "NumpadArrowRight":
        case "ArrowRight":
            setExpanded(element, true);
            break;
        case "NumpadArrowLeft":
        case "ArrowLeft":
            setExpanded(element, false);
            break;
    }
    event.stopPropagation();
}

function handleMenuExpanderKeyDownAsync(element, origStyle, event) {
    switch (event.code) {
        case "NumpadEnter":
        case "Enter":
            toggleMenuExpandedAsync(element, origStyle, event);
            break;
        case "NumpadArrowRight":
        case "ArrowRight":
            setMenuExpanded(element, origStyle, true);
            break;
        case "NumpadArrowLeft":
        case "ArrowLeft":
            setMenuExpanded(element, origStyle, false);
            break;
    }
    event.stopPropagation();
}

function setExpanded(element, expand) {
    var collapsibleRegion = element.getElementsByClassName("items")[0];
    var button = element.getElementsByClassName("expand-collapse-button")[0];
    if (expand) {
        button.classList.add("rotate");
        collapsibleRegion.style.height = 'auto';
        element.classList.add('expanded');

    } else {
        button.classList.remove("rotate");
        collapsibleRegion.style.height = '0px';
        element.classList.remove('expanded');
    }
}

function setMenuExpanded(element, origStyle, expand) {
    let parent = element.parentElement;
    if (expand) {
        parent.classList.remove('collapsed');
        parent.style.cssText = origStyle;
        parent.ariaExpanded = 'true';
        element.ariaExpanded = 'true';
    }
    else {
        parent.classList.add('collapsed');
        parent.style.width = '40px';
        parent.style.minWidth = '40px';
        parent.ariaExpanded = 'false';
        element.ariaExpanded = 'false';
    }
}

// SIG // Begin signature block
// SIG // MIIpFwYJKoZIhvcNAQcCoIIpCDCCKQQCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // eF/4BdCkdBkGUP8wwoG357r8w9PtC9C84qfGbLEdCqqg
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
// SIG // TkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0xghqK
// SIG // MIIahgIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSgw
// SIG // JgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5nIFBD
// SIG // QSAyMDExAhMzAAAErHYv/m7SjIRoAAAAAASsMA0GCWCG
// SIG // SAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgorBgEE
// SIG // AYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEEAYI3
// SIG // AgEVMC8GCSqGSIb3DQEJBDEiBCAoWIF4k2cbj+VklRVr
// SIG // Wlvp7XcekYGxCv8GyewyszXtRjBCBgorBgEEAYI3AgEM
// SIG // MTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAYaHR0
// SIG // cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3DQEB
// SIG // AQUABIIBgJnhBN8jT0Sa/xkfHf+RO2kH+8pcPNWWYGnN
// SIG // x2zOOS/2izh7mf9VtU4B0+ijkb058ic+5Zcv7bmivggn
// SIG // ZihafKQ3lfMlR68PQ4S+mz8ONEtXBbfNhObwI4ZsLxm1
// SIG // iqCtr5KKXOH9HCOhC8AGVlEU+Y+/g7Dg0k1ipjEPSQlj
// SIG // xWxBNF4iQpUJ9iIgHV+ce/NkJSys0x0ilWNEpj1IF+gM
// SIG // 67htvaUNp7zqfy+Wgu9n9tIocWU7XBkQfAMKUMkctNyu
// SIG // OTLUUICEySE7RSTLR01gZFW58SSLOwRtThx0vZUG5omP
// SIG // bs1EF95dnFwvej9XTa4Ik+G0XiBSCluWzVmBqKB6Ss3s
// SIG // pidhxLrzoDXQN+qeUHOKHgGWpHzBS7FO5CcSiP8ejRwx
// SIG // 2QLWA01PeL4RFwHKbtIzWZX9JoLv5l8/nP9LpgeAHlDk
// SIG // f67JqETkMkeN87vYGC0AXZup87FvOXYrSz5R/mmBHfqO
// SIG // zsQfSSXr/mED2PBOEgMPbALbDxhOuRBTYYlVsKGCF5Qw
// SIG // gheQBgorBgEEAYI3AwMBMYIXgDCCF3wGCSqGSIb3DQEH
// SIG // AqCCF20wghdpAgEDMQ8wDQYJYIZIAWUDBAIBBQAwggFS
// SIG // BgsqhkiG9w0BCRABBKCCAUEEggE9MIIBOQIBAQYKKwYB
// SIG // BAGEWQoDATAxMA0GCWCGSAFlAwQCAQUABCB3iVlFYlIe
// SIG // njin7/NsTU0NsJ4lCr1Smi5TzPbeDkWWzwIGaPBuhByh
// SIG // GBMyMDI1MTAyMTAyMjU1NC4wNzRaMASAAgH0oIHRpIHO
// SIG // MIHLMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSUwIwYDVQQLExxN
// SIG // aWNyb3NvZnQgQW1lcmljYSBPcGVyYXRpb25zMScwJQYD
// SIG // VQQLEx5uU2hpZWxkIFRTUyBFU046ODkwMC0wNUUwLUQ5
// SIG // NDcxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1w
// SIG // IFNlcnZpY2WgghHqMIIHIDCCBQigAwIBAgITMwAAAg4s
// SIG // yyh9lSB1YwABAAACDjANBgkqhkiG9w0BAQsFADB8MQsw
// SIG // CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQ
// SIG // MA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDAeFw0yNTAxMzAx
// SIG // OTQzMDNaFw0yNjA0MjIxOTQzMDNaMIHLMQswCQYDVQQG
// SIG // EwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
// SIG // BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENv
// SIG // cnBvcmF0aW9uMSUwIwYDVQQLExxNaWNyb3NvZnQgQW1l
// SIG // cmljYSBPcGVyYXRpb25zMScwJQYDVQQLEx5uU2hpZWxk
// SIG // IFRTUyBFU046ODkwMC0wNUUwLUQ5NDcxJTAjBgNVBAMT
// SIG // HE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZpY2UwggIi
// SIG // MA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQCs5t7i
// SIG // RtXt0hbeo9ME78ZYjIo3saQuWMBFQ7X4s9vooYRABTOf
// SIG // 2poTHatx+EwnBUGB1V2t/E6MwsQNmY5XpM/75aCrZdxA
// SIG // nrV9o4Tu5sBepbbfehsrOWRBIGoJE6PtWod1CrFehm1d
// SIG // iz3jY3H8iFrh7nqefniZ1SnbcWPMyNIxuGFzpQiDA+E5
// SIG // YS33meMqaXwhdb01Cluymh/3EKvknj4dIpQZEWOPM3jx
// SIG // bRVAYN5J2tOrYkJcdDx0l02V/NYd1qkvUBgPxrKviq5k
// SIG // z7E6AbOifCDSMBgcn/X7RQw630Qkzqhp0kDU2qei/ao9
// SIG // IHmuuReXEjnjpgTsr4Ab33ICAKMYxOQe+n5wqEVcE9OT
// SIG // yhmWZJS5AnWUTniok4mgwONBWQ1DLOGFkZwXT334IPCq
// SIG // d4/3/Ld/ItizistyUZYsml/C4ZhdALbvfYwzv31Oxf8N
// SIG // TmV5IGxWdHnk2Hhh4bnzTKosEaDrJvQMiQ+loojM7f5b
// SIG // gdyBBnYQBm5+/iJsxw8k227zF2jbNI+Ows8HLeZGt8t6
// SIG // uJ2eVjND1B0YtgsBP0csBlnnI+4+dvLYRt0cAqw6PiYS
// SIG // z5FSZcbpi0xdAH/jd3dzyGArbyLuo69HugfGEEb/sM07
// SIG // rcoP1o3cZ8eWMb4+MIB8euOb5DVPDnEcFi4NDukYM91g
// SIG // 1Dt/qIek+rtE88VS8QIDAQABo4IBSTCCAUUwHQYDVR0O
// SIG // BBYEFIVxRGlSEZE+1ESK6UGI7YNcEIjbMB8GA1UdIwQY
// SIG // MBaAFJ+nFV0AXmJdg/Tl0mWnG1M1GelyMF8GA1UdHwRY
// SIG // MFYwVKBSoFCGTmh0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvY3JsL01pY3Jvc29mdCUyMFRpbWUtU3Rh
// SIG // bXAlMjBQQ0ElMjAyMDEwKDEpLmNybDBsBggrBgEFBQcB
// SIG // AQRgMF4wXAYIKwYBBQUHMAKGUGh0dHA6Ly93d3cubWlj
// SIG // cm9zb2Z0LmNvbS9wa2lvcHMvY2VydHMvTWljcm9zb2Z0
// SIG // JTIwVGltZS1TdGFtcCUyMFBDQSUyMDIwMTAoMSkuY3J0
// SIG // MAwGA1UdEwEB/wQCMAAwFgYDVR0lAQH/BAwwCgYIKwYB
// SIG // BQUHAwgwDgYDVR0PAQH/BAQDAgeAMA0GCSqGSIb3DQEB
// SIG // CwUAA4ICAQB14L2TL+L8OXLxnGSal2h30mZ7FsBFooiY
// SIG // kUVOY05F9pnwPTVufEDGWEpNNy2OfaUHWIOoQ/9/rjwO
// SIG // 0hS2SpB0BzMAk2gyz92NGWOpWbpBdMvrrRDpiWZi/uLS
// SIG // 4ZGdRn3P2DccYmlkNP+vaRAXvnv+mp27KgI79mJ9hGyC
// SIG // QbvtMIjkbYoLqK7sF7Wahn9rLjX1y5QJL4lvEy3QmA9K
// SIG // RBj56cEv/lAvzDq7eSiqRq/pCyqyc8uzmQ8SeKWyWu6D
// SIG // jUA9vi84QsmLjqPGCnH4cPyg+t95RpW+73snhew1iCV+
// SIG // wXu2RxMnWg7EsD5eLkJHLszUIPd+XClD+FTvV03GfrDD
// SIG // fk+45flH/eKRZc3MUZtnhLJjPwv3KoKDScW4iV6SbCRy
// SIG // cYPkqoWBrHf7SvDA7GrH2UOtz1Wa1k27sdZgpG6/c9Cq
// SIG // KI8CX5vgaa+A7oYHb4ZBj7S8u8sgxwWK7HgWDRByOH3C
// SIG // iJu4LJ8h3TiRkRArmHRp0lbNf1iAKuL886IKE912v0yq
// SIG // 55t8jMxjBU7uoLsrYVIoKkzh+sAkgkpGOoZL14+dlxVM
// SIG // 91Bavza4kODTUlwzb+SpXsSqVx8nuB6qhUy7pqpgww1q
// SIG // 4SNhAxFnFxsxiTlaoL75GNxPR605lJ2WXehtEi7/+YfJ
// SIG // qvH+vnqcpqCjyQ9hNaVzuOEHX4MyuqcjwjCCB3EwggVZ
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
// SIG // gm2lBRDBcQZqELQdVTNYs6FwZvKhggNNMIICNQIBATCB
// SIG // +aGB0aSBzjCByzELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMG
// SIG // A1UECxMcTWljcm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9u
// SIG // czEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjg5MDAt
// SIG // MDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloiMKAQEwBwYFKw4DAhoDFQBK
// SIG // 6HY/ZWLnOcMEQsjkDAoB/JZWCKCBgzCBgKR+MHwxCzAJ
// SIG // BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
// SIG // DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
// SIG // ZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29m
// SIG // dCBUaW1lLVN0YW1wIFBDQSAyMDEwMA0GCSqGSIb3DQEB
// SIG // CwUAAgUA7KDbSzAiGA8yMDI1MTAyMDE2MDExNVoYDzIw
// SIG // MjUxMDIxMTYwMTE1WjB0MDoGCisGAQQBhFkKBAExLDAq
// SIG // MAoCBQDsoNtLAgEAMAcCAQACAhkTMAcCAQACAhI0MAoC
// SIG // BQDsoizLAgEAMDYGCisGAQQBhFkKBAIxKDAmMAwGCisG
// SIG // AQQBhFkKAwKgCjAIAgEAAgMHoSChCjAIAgEAAgMBhqAw
// SIG // DQYJKoZIhvcNAQELBQADggEBAAxRKpj6Q3Z+dUbl+RN4
// SIG // adzkqt7r3ekZhd/C54ujg8++oJCjM8BbKKJpl9tv+nDu
// SIG // TIunHSdSRz3I6knu83tlZiJKg+qHDt7v6tl3ZLoODrSn
// SIG // 3d5COH17XpiXn5tLiZa8WdyqajVdWOfT1WI15I7FSsOa
// SIG // IznE/s9aREyShKGAf6K17Ht7nNon5bdmhj7JOak/I5OK
// SIG // n66BLu2qCKDuHDn3++n6jYCwmoz74ng0CO/RnwBBZZOv
// SIG // E7Zddy3q2V2VMZRmMxzydKQVbXgxPpnyCC4a2AP6QcqL
// SIG // HNVAMz3iOlu4wUcmh7aj3hCeddFb3OGCCA6OleGWKLVa
// SIG // XHDFBSt3OhuC8JQxggQNMIIECQIBATCBkzB8MQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQg
// SIG // VGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAg4syyh9lSB1
// SIG // YwABAAACDjANBglghkgBZQMEAgEFAKCCAUowGgYJKoZI
// SIG // hvcNAQkDMQ0GCyqGSIb3DQEJEAEEMC8GCSqGSIb3DQEJ
// SIG // BDEiBCDjOlcHLuKIMDhY12E8pi6MfA8iNDC4xu2yTfbK
// SIG // FEfi5zCB+gYLKoZIhvcNAQkQAi8xgeowgecwgeQwgb0E
// SIG // IAF0HXMl8OmBkK267mxobKSihwOdP0eUNXQMypPzTxKG
// SIG // MIGYMIGApH4wfDELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQG
// SIG // A1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIw
// SIG // MTACEzMAAAIOLMsofZUgdWMAAQAAAg4wIgQgGNT96dvo
// SIG // lmBP0v6ukpTt0lz7cRP8uaH0neqR0Pz7w+YwDQYJKoZI
// SIG // hvcNAQELBQAEggIAOZLWHjuiBKU4CuniA+drq6gmfSlU
// SIG // lGIGgeashQ03pIfVFze2HGlfgZOvhMR+RbauXI3HBPjr
// SIG // +kEo4EjbHunolU0bGRQNs7lWS9fn1s9NjQWgz50wS1wt
// SIG // 8qerhl64xevWxEe4vsJuYab+oou14bZl3WvDjGRtcBLn
// SIG // E2XOtdJ5oYQULpNMIXLSdUH+NgQ2kwFW7OjBlkG3Q4lK
// SIG // 5pJZOZN3iHaDgXcisxjO85GA4lFf2e9sYYiRHz8wt/yZ
// SIG // QXW85XkmxrQ5TlHf0XvGsLMYE4sJWGi/rPT+MzdW5LUh
// SIG // QbChn9G/ggnJo7IN5MSOOJb5A7ZwiRa/fRvqC4nXuRVC
// SIG // HRoWvBMUvNHT8Mgftlo/rmjjWVRLWqN4Lkar1M3222ck
// SIG // 04SWzQXijCzKTnd8FIevFFTjxjWMb53QR/V+1EpV3mJD
// SIG // iOm7vuqb3D3kykL6xO76JXAfN6xcTa3aIO7RTkvqJTs1
// SIG // vmyqdW0h554mcbmvB1ZMq4LfshZtzjss7+B1c/x0GtuD
// SIG // Z9aYyS4UasW1mL0sJayQv3XudrV/566Q7sRAPmADhLco
// SIG // rtj/O1XSYOrvyCF0hXmmMjPpYitbxQqDg7IRH9fA/ynk
// SIG // Ll9tDS6TEwwBAlMo2eY+ok/OG8Ll5eLKj7uHXNeGaTWQ
// SIG // /QERaKeC0i8btvvI126qV46qqQJsKC2Qv2GWwqc=
// SIG // End signature block
