let resizeObserver;
let observerAddRemove;
let lastHandledState = { id: null, isHorizontal: null };
export function fluentOverflowInitialize(dotNetHelper, id, isHorizontal, querySelector, threshold) {
    var localSelector = querySelector;
    if (!localSelector) {
        // cannot use :scope for node.matches() further down
        localSelector = ".fluent-overflow-item";
    }

    // Create a Add/Remove Observer, started later
    observerAddRemove = new MutationObserver(mutations => {
        mutations.forEach(mutation => {

            // Only new node (type=childList)
            if (mutation.type !== 'childList' && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                return
            }

            // Only for localSelector element
            const node = mutation.addedNodes.length > 0 ? mutation.addedNodes[0] : mutation.removedNodes[0];
            if (node.nodeType !== Node.ELEMENT_NODE || !node.matches(localSelector)) {
                return;
            }

            fluentOverflowRefresh(dotNetHelper, id, isHorizontal, querySelector, threshold);
        });
    });
    var el = document.getElementById(id);

    // Stop the resize observation if the element is already observed
    if (resizeObserver && el) {
        resizeObserver.unobserve(el);
    }

    let resizeTimeout;
    resizeObserver = new ResizeObserver((entries) => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            fluentOverflowRefresh(dotNetHelper, id, isHorizontal, querySelector, threshold);
        }, 100); // Adjust the timeout as needed
    });

    // Create a ResizeObserver, started later
    resizeObserver = new ResizeObserver((entries) => {
        fluentOverflowRefresh(dotNetHelper, id, isHorizontal, querySelector, threshold);
    });

    // Start the resize observation
    if (el) {
        resizeObserver.observe(el);
        observerAddRemove.observe(el, { childList: true, subtree: false });
    }

    lastHandledState.id = id;
    lastHandledState.isHorizontal = isHorizontal;
}

// When the Element[id] is resized, set overflow attribute to all element outside of this element.
// Except for elements with fixed attribute.
export function fluentOverflowRefresh(dotNetHelper, id, isHorizontal, querySelector, threshold) {
    let container = document.getElementById(id);
    if (!container) return;

    if (!querySelector) {
        querySelector = ":scope .fluent-overflow-item";
    }
    else {
        querySelector = ":scope >" + querySelector;
    }
    let allItems = container.querySelectorAll(querySelector);
    let items = container.querySelectorAll(querySelector + ":not([fixed])");      // List of first level element of this container
    let fixedItems = container.querySelectorAll(querySelector + "[fixed]");       // List of element defined as fixed (not "overflowable")
    let itemsTotalSize = threshold > 0 ? 10 : 0;
    let containerMaxSize = isHorizontal ? container.offsetWidth : container.offsetHeight;
    let overflowChanged = false;
    let containerGap = parseFloat(window.getComputedStyle(container).gap);
    if (!containerGap) containerGap = 0;

    containerMaxSize -= threshold; // Account for the overflow bage width

    if (lastHandledState.id === id && lastHandledState.isHorizontal !== isHorizontal) {
        allItems.forEach(element => {
            element.removeAttribute("overflow");
            element.overflowSize = null;
        });
    }

    // Size of all fixed elements
    fixedItems.forEach(element => {
        element.overflowSize = isHorizontal ? getElementWidth(element) : getElementHeight(element);
        element.overflowSize += containerGap;
        itemsTotalSize += element.overflowSize;
    });

    // Add overflow attribute, if the element is out of total size.
    items.forEach(element => {
        let isOverflow = element.hasAttribute("overflow");

        // Compute element size (if not already set)
        // Save this element.size in the attribute 'overflowSize'
        if (!isOverflow) {
            element.overflowSize = isHorizontal ? getElementWidth(element) : getElementHeight(element);
            element.overflowSize += containerGap;
        }

        itemsTotalSize += element.overflowSize;

        // Only check for overflow if the container has a size
        if (containerMaxSize > 0) {
            if (itemsTotalSize > containerMaxSize) {
                // Add an attribute 'overflow'
                if (!isOverflow) {
                    element.setAttribute("overflow", "");
                    overflowChanged = true;
                }
            }
            else {
                // Remove the attribute 'overflow'
                if (isOverflow) {
                    element.removeAttribute("overflow");
                    overflowChanged = true;
                }
            }
        }

    });

    // If an attribute 'overflow' has been added or removed,
    // raise a C# method
    if (overflowChanged) {
        let listOfOverflow = [];
        items.forEach(element => {
            listOfOverflow.push({
                Id: element.id,
                Overflow: element.hasAttribute("overflow"),
                Text: element.innerText.trim()
            });
        });
        dotNetHelper.invokeMethodAsync("OverflowRaisedAsync", JSON.stringify(listOfOverflow));
    }
    lastHandledState.id = id;
    lastHandledState.isHorizontal = isHorizontal;
}

export function fluentOverflowDispose(id) {
    let el = document.getElementById(id);
    if (el) {
        resizeObserver.unobserve(el);
        observerAddRemove.disconnect();
    }
}

// Compute the element Width, including paddings, margins and borders.
function getElementWidth(element) {
    var style = element.currentStyle || window.getComputedStyle(element);
    var width = element.offsetWidth;    // Width including paddings and borders
    var margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight);
    return width + margin;
}

// Compute the element Height, including paddings, margins and borders.
function getElementHeight(element) {
    var style = element.currentStyle || window.getComputedStyle(element);
    var height = element.offsetHeight;    // Height including paddings and borders
    var margin = parseFloat(style.marginTop) + parseFloat(style.marginBottom);
    return height + margin;
}

// SIG // Begin signature block
// SIG // MIIpMAYJKoZIhvcNAQcCoIIpITCCKR0CAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // mH0Vv4h4AvLqy65dut657RTpeuRBZASZOeZEpsK1msKg
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
// SIG // AgEVMC8GCSqGSIb3DQEJBDEiBCC0hu2D8hWu0izIT5Ee
// SIG // m5ab8h20XtHLY04iK3BSE3f4IzBCBgorBgEEAYI3AgEM
// SIG // MTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAYaHR0
// SIG // cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3DQEB
// SIG // AQUABIIBgHWR8rdegG+5ERi1ZxuHNJ3B3Um4Ri+2JY0N
// SIG // j8HQn5+4whYmoljrhOzbB/pwxQL98kySD6LeCfsvOuGR
// SIG // 459RaPfyLg9bdksd6DeQtewVigJjkgYUJvrbDBA6DqOu
// SIG // st6VVOaaor8T/rWu5CfSD4PTxmGd75pFyW9xINHL2zpA
// SIG // 4BMwVKnCdHvgECf+AbfuSE20gOIF6gfYITRxsT7Td4rt
// SIG // bS2v2/8uX8fo/KbZp7iSeDwLeKOExuqZkKiBOTCd7o1Y
// SIG // FfYuFl+Qgz5UC695zaesDn93Km9xoCC2hOiLXxneTwD+
// SIG // X6F/Auw/3f4xx/0kJZJfwUplySuo7V/R+is0p5gHNHnp
// SIG // LJf5plD+TJwXEDl0o7TasKrQ6mTOhW93RgNeJ403kcoZ
// SIG // 5EprL+wHRaJwFhjzJ8b7xVdpy+uMHu6uNxFAc0biQYwQ
// SIG // zFCM4yPiDGHGyVGmFpyeq3941KE5Z15QIVFXLeWMmRme
// SIG // E1H7s3JAf//zj5y62P3ugVYs65MzyfVC5++gNaGCF60w
// SIG // ghepBgorBgEEAYI3AwMBMYIXmTCCF5UGCSqGSIb3DQEH
// SIG // AqCCF4YwgheCAgEDMQ8wDQYJYIZIAWUDBAIBBQAwggFa
// SIG // BgsqhkiG9w0BCRABBKCCAUkEggFFMIIBQQIBAQYKKwYB
// SIG // BAGEWQoDATAxMA0GCWCGSAFlAwQCAQUABCDnqbggEIE6
// SIG // d4RDldqB5CF25Ljpr/udCr8dx3T9dS5heQIGaPKRTnik
// SIG // GBMyMDI1MTAyMTAyMjU1Ny4wODZaMASAAgH0oIHZpIHW
// SIG // MIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQLEyRN
// SIG // aWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0
// SIG // ZWQxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVTTjo2NTFB
// SIG // LTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRp
// SIG // bWUtU3RhbXAgU2VydmljZaCCEfswggcoMIIFEKADAgEC
// SIG // AhMzAAACFRgD04EHJnxTAAEAAAIVMA0GCSqGSIb3DQEB
// SIG // CwUAMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMT
// SIG // HU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwMB4X
// SIG // DTI1MDgxNDE4NDgyMFoXDTI2MTExMzE4NDgyMFowgdMx
// SIG // CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9u
// SIG // MRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
// SIG // b3NvZnQgQ29ycG9yYXRpb24xLTArBgNVBAsTJE1pY3Jv
// SIG // c29mdCBJcmVsYW5kIE9wZXJhdGlvbnMgTGltaXRlZDEn
// SIG // MCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjY1MUEtMDVF
// SIG // MC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBTZXJ2aWNlMIICIjANBgkqhkiG9w0BAQEFAAOC
// SIG // Ag8AMIICCgKCAgEAw3HV3hVxL0lEYPV03XeNKZ517VIb
// SIG // gexhlDPdpXwDS0BYtxPwi4XYpZR1ld0u6cr2Xjuugdg5
// SIG // 0DUx5WHL0QhY2d9vkJSk02rE/75hcKt91m2Ih287QRxR
// SIG // MmFu3BF6466k8qp5uXtfe6uciq49YaS8p+dzv3uTarD4
// SIG // hQ8UT7La95pOJiRqxxd0qOGLECvHLEXPXioNSx9pyhzh
// SIG // m6lt7ezLxJeFVYtxShkavPoZN0dOCiYeh4KgoKoyagzM
// SIG // uSiLCiMUW4Ue4Qsm658FJNGTNh7V5qXYVA6k5xjw5WeW
// SIG // dKOz0i9A5jBcbY9fVOo/cA8i1bytzcDTxb3nctcly8/O
// SIG // YeNstkab/Isq3Cxe1vq96fIHE1+ZGmJjka1sodwqPycV
// SIG // p/2tb+BjulPL5D6rgUXTPF84U82RLKHV57bB8fHRpgnj
// SIG // cWBQuXPgVeSXpERWimt0NF2lCOLzqgrvS/vYqde5Ln9Y
// SIG // lKKhAZ/xDE0TLIIr6+I/2JTtXP34nfjTENVqMBISWcak
// SIG // IxAwGb3RB5yHCxynIFNVLcfKAsEdC5U2em0fAvmVv0so
// SIG // nqnv17cuaYi2eCLWhoK1Ic85Dw7s/lhcXrBpY4n/Rl5l
// SIG // 3wHzs4vOIhu87DIy5QUaEupEsyY0NWqgI4BWl6v1wgse
// SIG // +l8DWFeUXofhUuCgVTuTHN3K8idoMbn8Q3edUIECAwEA
// SIG // AaOCAUkwggFFMB0GA1UdDgQWBBSJIXfxcqAwFqGj9jdw
// SIG // QtdSqadj1zAfBgNVHSMEGDAWgBSfpxVdAF5iXYP05dJl
// SIG // pxtTNRnpcjBfBgNVHR8EWDBWMFSgUqBQhk5odHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NybC9NaWNy
// SIG // b3NvZnQlMjBUaW1lLVN0YW1wJTIwUENBJTIwMjAxMCgx
// SIG // KS5jcmwwbAYIKwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAC
// SIG // hlBodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3Bz
// SIG // L2NlcnRzL01pY3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQ
// SIG // Q0ElMjAyMDEwKDEpLmNydDAMBgNVHRMBAf8EAjAAMBYG
// SIG // A1UdJQEB/wQMMAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQE
// SIG // AwIHgDANBgkqhkiG9w0BAQsFAAOCAgEAd42HtV+kGbvx
// SIG // zLBTC5O7vkCIBPy/BwpjCzeL53hAiEOebp+VdNnwm9GV
// SIG // CfYq3KMfrj4UvKQTUAaS5Zkwe1gvZ3ljSSnCOyS5OwNu
// SIG // 9dpg3ww+QW2eOcSLkyVAWFrLn6Iig3TC/zWMvVhqXtdF
// SIG // hG2KJ1lSbN222csY3E3/BrGluAlvET9gmxVyyxNy59/7
// SIG // JF5zIGcJibydxs94JL1BtPgXJOfZzQ+/3iTc6eDtmaWT
// SIG // 6DKdnJocp8wkXKWPIsBEfkD6k1Qitwvt0mHrORah75Sj
// SIG // ecOKt4oWayVLkPTho12e0ongEg1cje5fxSZGthrMrWKv
// SIG // I4R7HEC7k8maH9ePA3ViH0CVSSOefaPTGMzIhHCo5p3j
// SIG // G5SMcyO3eA9uEaYQJITJlLG3BwwGmypY7C/8/nj1SOhg
// SIG // x1HgJ0ywOJL9xfP4AOcWmCfbsqgGbCaC7WH5sINdzfMa
// SIG // r8V7YNFqkbCGUKhc8GpIyE+MKnyVn33jsuaGAlNRg7dV
// SIG // RUSoYLJxvUsw9GOwyBpBwbE9sqOLm+HsO00oF23PMio7
// SIG // WFXcFTZAjp3ujihBAfLrXICgGOHPdkZ042u1LZqOcnlr
// SIG // 3XzvgMe+mPPyasW8f0rtzJj3V5E/EKiyQlPxj9Mfq2x9
// SIG // himnlXWGZCVPeEBROrNbDYBfazTyLNCOTsRtksOSV3FB
// SIG // tPnpQtLN754wggdxMIIFWaADAgECAhMzAAAAFcXna54C
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
// SIG // BAsTHm5TaGllbGQgVFNTIEVTTjo2NTFBLTA1RTAtRDk0
// SIG // NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAg
// SIG // U2VydmljZaIjCgEBMAcGBSsOAwIaAxUAj6eTejbuYE1I
// SIG // fjbfrt6tXevCUSCggYMwgYCkfjB8MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0BAQsFAAIFAOyh
// SIG // BA0wIhgPMjAyNTEwMjAxODU1MDlaGA8yMDI1MTAyMTE4
// SIG // NTUwOVowdDA6BgorBgEEAYRZCgQBMSwwKjAKAgUA7KEE
// SIG // DQIBADAHAgEAAgIRTzAHAgEAAgIUrTAKAgUA7KJVjQIB
// SIG // ADA2BgorBgEEAYRZCgQCMSgwJjAMBgorBgEEAYRZCgMC
// SIG // oAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0GCSqGSIb3
// SIG // DQEBCwUAA4IBAQDOZJHA10PMPQWAdCbGZGZctBWn8rTG
// SIG // kJpmyvUeNHCQJIKdfRbwXtZcf580ePfy1JRvsFKGM3vj
// SIG // tIYTcQyRMwEv9D7uZ0Axxk7dHETihG9std/f9zZp0KaP
// SIG // HDq3JDwz1URf5kb3TVVpn8fTINoMnMMZKhDIQgcNjg9s
// SIG // gZqPUoXloJ/iVFAUfl0vk/r+kdexRTOoYxv4KnEOSadd
// SIG // Q0fZ7v+bSV6tAMm4V9ArjyELhLjqcF9J4HDuGJD5g6w3
// SIG // HWKaJmOWiXhf9S9vCjOWbwRrRU500iBP3RxwmCn56u0t
// SIG // jEQRhxGyBuJFe0RwMdqNGOsuOCIIHJHdrWD46b06rCj5
// SIG // IlbXMYIEDTCCBAkCAQEwgZMwfDELMAkGA1UEBhMCVVMx
// SIG // EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1Jl
// SIG // ZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3Jh
// SIG // dGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3Rh
// SIG // bXAgUENBIDIwMTACEzMAAAIVGAPTgQcmfFMAAQAAAhUw
// SIG // DQYJYIZIAWUDBAIBBQCgggFKMBoGCSqGSIb3DQEJAzEN
// SIG // BgsqhkiG9w0BCRABBDAvBgkqhkiG9w0BCQQxIgQgVtpX
// SIG // 7FXu5ZtQZmvU0463FfXyY8Y1FbVBke2PJg6pvVMwgfoG
// SIG // CyqGSIb3DQEJEAIvMYHqMIHnMIHkMIG9BCBwEPR2PDrT
// SIG // FLcrtQsKrUi7oz5JNRCF/KRHMihSNe7sijCBmDCBgKR+
// SIG // MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1p
// SIG // Y3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMzAAAC
// SIG // FRgD04EHJnxTAAEAAAIVMCIEINOVnmGt3doVAnCqSDgG
// SIG // QoYhXDdFFqoFpCDaEkJrVkq8MA0GCSqGSIb3DQEBCwUA
// SIG // BIICACq0yj9DE2MQbEoDgB3+OfbaALNP7uWNKob1W+rl
// SIG // Mrtpk3/6HEUEl4sv6tjNBcxNpvWvpL05FTkPV/JqcqSI
// SIG // jh2TdxSO5uVfNJJLwb8q6coG9ShY5IecNjOXHygp+gZc
// SIG // M0xbXOx7RcnHigLJbuhTtXA2eTC09nXvSHwyISfYNPXp
// SIG // ++skBmkqJa7HuKjYhm2sqyMnQIpJh75hTNsSCbRyBMtN
// SIG // m0VYow9lBatjxc8YjkUlFbzT35G//WyN4oLPbJJFzGyV
// SIG // GDY2Te2p/3/QnS+R+RBYGg8FJlRnFOndKxKW/SCRAkgs
// SIG // a1LJ/LjZ91hK2ty4eXCLJoP/bF3Yv4K6p5qVi0BO9yqi
// SIG // Boy0UPA0GPAZzUt3g9FRv2aalU2DZYIH6EcguQe2EXYb
// SIG // xS9ngpIfI11Emcct0fkDfa9rcELoCbrjMYAHO3/FYw+8
// SIG // IARYncOyEugRX1T+ndcQTzhgyzxFp/f8ul1Ma/Dmdxin
// SIG // WaTOhDtHiQXSe97Y/3EifGEXJKnMWMw7FBHGNcIV8u9C
// SIG // tUP2FR9FgFSU+D+aINKpIX5KOdz4BwxztKGF8h+nC8KB
// SIG // S3yWCR/sedzglMJnh6TVLw26SeNDXYhJPJqXHMrgDupX
// SIG // V4u4ygO6ggINXqngiU9C5mH8kWld35kdBtturVg+ftFU
// SIG // 5TEidvBfn3cmZBdbeuK9etr/hJPP
// SIG // End signature block
