import hljs from '/js/highlight-11.10.0.min.js'

export function initializeAssistantChat(options) {
    const container = document.getElementById(options.containerId);

    if (container.assistantChat) {
        console.log("Assistant chat already created.");
        return;
    }

    const assistantChat = new AssistantChat(options);
    container.assistantChat = assistantChat;

    assistantChat.initializeExistingMessages();
    assistantChat.attachTextareaKeyDownEvent();
}

export function initializeCurrentMessage(options) {
    const container = document.getElementById(options.containerId);
    const assistantChat = container.assistantChat;

    if (!assistantChat) {
        console.log("Assistant chat not initialized.");
        return;
    }

    assistantChat.initializeCurrentMessage(options.chatMessageId);
}

export function completeCurrentMessage(options) {
    const container = document.getElementById(options.containerId);
    const assistantChat = container.assistantChat;

    if (!assistantChat) {
        console.log("Assistant chat not initialized.");
        return;
    }

    assistantChat.completeCurrentMessage(options.chatMessageId);
}

export function scrollToBottomChatAssistant(options) {
    const container = document.getElementById(options.containerId);
    const assistantChat = container.assistantChat;

    if (!assistantChat) {
        console.log("Assistant chat not initialized.");
        return;
    }

    assistantChat.scrollToBottom();
}

class AssistantChat {
    constructor(options) {
        this.chatAssistantContainer = document.getElementById(options.containerId);
        this.scrollBottomButton = document.getElementById(options.scrollBottomButtonId);
        this.form = document.getElementById(options.formId);
        this.textarea = document.getElementById(options.textareaId);
        this.messageCount = 0;

        this.chatAssistantContainer.addEventListener("scroll", () => {
            this.updateScrollTimeout();
            this.checkScrollPosition();
        });

        // Watch for both the chat area resizing and its content changing.
        var resizeObserver = new ResizeObserver(() => {
            this.checkScrollPosition();
        });
        resizeObserver.observe(this.chatAssistantContainer);
        var mutationObserver = new MutationObserver((r) => {
            this.checkScrollPosition();
        });
        mutationObserver.observe(this.chatAssistantContainer, { childList: true, subtree: true, characterData: true });

        this.scrollBottomButton.addEventListener("click", () => this.scrollToBottom());
    }

    scrollToBottom() {
        this.scrollBottomButton.style.display = 'none';
        this.chatAssistantContainer.scrollTop = this.chatAssistantContainer.scrollHeight;

        // Because the scroll behavior is smooth, the element isn't immediately scrolled to the bottom.
        // Detect when the element is scrolling and don't raise events until it is finished.
        this.scrollingToBottom = true;
        this.updateScrollTimeout();
    }

    updateScrollTimeout() {
        if (this.scrollTimeout) {
            // Cancel previous timer.
            clearTimeout(this.scrollTimeout);
        }

        // Set a new timer. The element has finished scrolling when the timer passes.
        this.scrollTimeout = setTimeout(() => {
            this.scrollingToBottom = false;
            this.checkScrollPosition();
        }, 150);
    }

    checkScrollPosition() {
        if (this.scrollingToBottom) {
            return;
        }

        var scrollableDiv = this.chatAssistantContainer;

        const isScrollable = scrollableDiv.scrollHeight > scrollableDiv.clientHeight;
        const isAtBottom = scrollableDiv.scrollTop + scrollableDiv.clientHeight >= scrollableDiv.scrollHeight - 10;

        // The scroll to bottom button is displayed if:
        // - There is a scroll bar
        // - We're not scrolled to the bottom
        // - There are messages (i.e. we're not on the splash view)
        if (isScrollable && !isAtBottom && this.messageCount > 0) {
            this.scrollBottomButton.style.display = '';
        } else {
            this.scrollBottomButton.style.display = 'none';
        }
    }

    initializeExistingMessages() {
        // Highlight code blocks in existing messages.
        var chatMessageElements = this.chatAssistantContainer.getElementsByClassName("assistant-message");

        var chatMessageElement = null;
        for (var i = 0; i < chatMessageElements.length; i++) {
            chatMessageElement = chatMessageElements[i];
            this.highlightCodeBlocks(chatMessageElement);
            this.messageCount++;
        }

        this.reactToNextStepsSize(chatMessageElement);
    }

    initializeCurrentMessage(chatMessageId) {
        // New message has started. Stop observing the old message.
        if (this.observer) {
            this.observer.disconnect();
        }

        this.messageCount++;

        // Follow up messages have been hidden so reset scroll to bottom button.
        this.scrollBottomButton.style.display = 'none';
        this.scrollBottomButton.style.setProperty("--next-steps-height", `0px`);

        const chatMessageElement = document.getElementById(chatMessageId);
        if (!chatMessageElement) {
            console.log(`Couldn't find ${chatMessageId}.`);
            return;
        }

        // Watch chat message for changes and highlight code blocks.
        // We're doing this in the client rather than via a Blazor invoke to avoid delay between HTML changing
        // and the code blocks being highlighted.
        this.observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === "childList" || mutation.type === "characterData") {
                    this.highlightCodeBlocks(mutation.target);
                }
            }
        });

        const config = { childList: true, subtree: true, characterData: true };
        this.observer.observe(chatMessageElement, config);
    }

    completeCurrentMessage(chatMessageId) {
        var chatMessage = document.getElementById(chatMessageId);

        // Run client logic when the assistant message is finished returning...
        if (chatMessage.classList.contains("assistant-message")) {
            // Focus the text area for entering the next message.
            this.textarea.focus();

            this.reactToNextStepsSize(chatMessage);
        }
    }

    reactToNextStepsSize(lastChatMessage) {
        // Get the height of the next steps area and subtract from the min height of the previous message.
        // This prevents the next steps being added to the UI from pushing the previous message up.
        var nextSteps = document.getElementsByClassName("chat-assistant-next-steps")[0];
        if (nextSteps) {
            if (lastChatMessage && lastChatMessage.classList.contains("last-message")) {
                lastChatMessage.style.setProperty("--next-steps-height", `${nextSteps.clientHeight}px`);
            }

            this.scrollBottomButton.style.setProperty("--next-steps-height", `${nextSteps.clientHeight}px`);
        }

        // Update check of scroll position after sizes are adjusted.
        this.checkScrollPosition();
    }

    highlightCodeBlocks(chatMessageElement) {
        var codeBlocks = chatMessageElement.getElementsByClassName("code-block");

        for (var i = 0; i < codeBlocks.length; i++) {
            var codeBlock = codeBlocks[i];

            var codeElements = codeBlock.getElementsByTagName("code");
            if (codeElements.length > 0) {
                var codeElement = codeElements[0];

                // Already highlighted.
                if (codeElement.dataset.highlighted) {
                    continue;
                }
                // No language specified. Don't try to auto detect.
                if (!codeElement.dataset.language) {
                    continue;
                }

                hljs.highlightElement(codeElement);
            }
        }
    }

    attachTextareaKeyDownEvent() {
        this.textarea.addEventListener('input', () => this.resizeToFit(this.textarea));
        this.afterPropertyWritten(this.textarea, 'value', () => this.resizeToFit(this.textarea));

        this.resizeToFit(this.textarea);
        this.textarea.focus();

        var previousHasValue = this.textarea.value != '';
        this.textarea.addEventListener("keydown", (event) => {
            // Only send message to the server if the enter key is pressed.
            // Allow enter+shift to add a new line in the textarea.
            if (event.key === "Enter" && !event.shiftKey) {
                // Prevents newline insertion.
                event.preventDefault();

                // Don't submit form with enter if a response is in progress
                var responseInProgress = this.textarea.dataset.responseInProgress === "true";
                if (!responseInProgress) {
                    // Blazor listens on the change event to bind the value.
                    this.textarea.dispatchEvent(new CustomEvent('change', { bubbles: true }));
                    // Submit form.
                    this.form.dispatchEvent(new CustomEvent('submit', { bubbles: true }));
                } else {
                    console.log("Enter ignored because response is in progress.");
                }
            } else {
                setTimeout(() => {
                    var hasValue = this.textarea.value != '';
                    if (previousHasValue != hasValue) {
                        this.textarea.dispatchEvent(new CustomEvent('change', { bubbles: true }));
                        previousHasValue = hasValue;
                    }
                }, 0);
            }
        });
    }

    resizeToFit(elem) {
        const lineHeight = parseFloat(getComputedStyle(elem).lineHeight);

        elem.rows = 1;
        const numLines = Math.ceil(elem.scrollHeight / lineHeight);
        elem.rows = Math.min(5, Math.max(1, numLines));
    }

    afterPropertyWritten(target, propName, callback) {
        const descriptor = this.getPropertyDescriptor(target, propName);
        Object.defineProperty(target, propName, {
            get: function () {
                return descriptor.get.apply(this, arguments);
            },
            set: function () {
                const result = descriptor.set.apply(this, arguments);
                callback();
                return result;
            }
        });
    }

    getPropertyDescriptor(target, propertyName) {
        return Object.getOwnPropertyDescriptor(target, propertyName)
            || this.getPropertyDescriptor(Object.getPrototypeOf(target), propertyName);
    }
}

// SIG // Begin signature block
// SIG // MIIpFwYJKoZIhvcNAQcCoIIpCDCCKQQCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // TefJPTbugyjhmG1sOaCpEcYwyzM+wnyM1bTpw5yt8IWg
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
// SIG // AgEVMC8GCSqGSIb3DQEJBDEiBCDgFKkG+nQbneKG2Gmq
// SIG // k0cwGAc8i/5x+trbZwlRxBMR9zBCBgorBgEEAYI3AgEM
// SIG // MTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAYaHR0
// SIG // cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3DQEB
// SIG // AQUABIIBgAGokAu4qY6fRyYsF46NUtN0rIEOKX+hci7A
// SIG // klOt8YvXDFkZ4eFYwht6d6RxQXJoX+evnYHkz5Wdskz7
// SIG // A1NK6pBYAKsdNHg6gHla9jPRKmLbGrOY+2xix1+PPdrM
// SIG // qJvWXifxYeiE0LCFlseOuWxVai2BTc0sHGOzElefBC6W
// SIG // WWIK5GhFbZKdaMMKMR3gGx2UdbRg+PshaD5lIP3MKZwk
// SIG // T5ckLZyx0Zn2k2uPEIgCu9xzvVE2lQhjfPiBvK4tn+6I
// SIG // H4sWPYEB+d4S/NTNKShT32Z7BMnvYI1v/rbQ+pSpiwFv
// SIG // GK+RijeBzeOkww/blcs9+75zyBp5uqG/9NfOrXhUzylq
// SIG // OIzral25/rnUU2/CkR16CfSqpyLZcjFM49VMc2IwAn0b
// SIG // 14m8SWY/jceUFOo1glr5qui7qtLh4kga0N5bkKJJ6n52
// SIG // AgLgbapQTf0jEiFJybzXQ7YdcUPr6DudpypMGjOByel7
// SIG // 2b/AUkEA59qKz1G3WMdeNNIiGJZFmAIjTo1qRKGCF5Qw
// SIG // gheQBgorBgEEAYI3AwMBMYIXgDCCF3wGCSqGSIb3DQEH
// SIG // AqCCF20wghdpAgEDMQ8wDQYJYIZIAWUDBAIBBQAwggFS
// SIG // BgsqhkiG9w0BCRABBKCCAUEEggE9MIIBOQIBAQYKKwYB
// SIG // BAGEWQoDATAxMA0GCWCGSAFlAwQCAQUABCDRnrBvTDdg
// SIG // lvIThNKgCFmq7GYTEE2S0ACBY0U+0QVj9AIGaPCblxC3
// SIG // GBMyMDI1MTAyMTAyMjY0OC42NzNaMASAAgH0oIHRpIHO
// SIG // MIHLMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSUwIwYDVQQLExxN
// SIG // aWNyb3NvZnQgQW1lcmljYSBPcGVyYXRpb25zMScwJQYD
// SIG // VQQLEx5uU2hpZWxkIFRTUyBFU046RjAwMi0wNUUwLUQ5
// SIG // NDcxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1w
// SIG // IFNlcnZpY2WgghHqMIIHIDCCBQigAwIBAgITMwAAAgU8
// SIG // dWyCRIfN/gABAAACBTANBgkqhkiG9w0BAQsFADB8MQsw
// SIG // CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQ
// SIG // MA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDAeFw0yNTAxMzAx
// SIG // OTQyNDlaFw0yNjA0MjIxOTQyNDlaMIHLMQswCQYDVQQG
// SIG // EwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
// SIG // BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENv
// SIG // cnBvcmF0aW9uMSUwIwYDVQQLExxNaWNyb3NvZnQgQW1l
// SIG // cmljYSBPcGVyYXRpb25zMScwJQYDVQQLEx5uU2hpZWxk
// SIG // IFRTUyBFU046RjAwMi0wNUUwLUQ5NDcxJTAjBgNVBAMT
// SIG // HE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZpY2UwggIi
// SIG // MA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQCSkvLf
// SIG // d7gF1r2wGdy85CFYXHUC8ywEyD4LRLv0WYEXeeZ0u5Yu
// SIG // K7p2cXVzQmZPOHTN8TWqG2SPlUb+7PldzFDDAlR3vU8p
// SIG // iOjmhu9rHW43M2dbor9jl9gluhzwUd2SciVGa7f9t67t
// SIG // M3KFKRSMXFtHKF3KwBB7aVo+b1qy5p9DWlo2N5FGrBqH
// SIG // MEVlNyzreHYoDLL+m8fSsqMu/iYUqxzK5F4S7IY5NemA
// SIG // B8B+A3QgwVIi64KJIfeKZUeiWKCTf4odUgP3AQilxh48
// SIG // P6z7AT4IA0dMEtKhYLFs4W/KNDMsYr7KpQPKVCcC5E8u
// SIG // DHdKewubyzenkTxy4ff1N3g8yho5Pi9BfjR0VytrkmpD
// SIG // fep8JPwcb4BNOIXOo1pfdHZ8EvnR7JFZFQiqpMZFlO5C
// SIG // AuTYH8ujc5PUHlaMAJ8NEa9TFJTOSBrB7PRgeh/6NJ2x
// SIG // u9yxPh/kVN9BGss93MC6UjpoxeM4x70bwbwiK8SNHIO8
// SIG // D8cql7VSevUYbjN4NogFFwhBClhodE/zeGPq6y6ixD4z
// SIG // 65IHY3zwFQbBVX/w+L/VHNn/BMGs2PGHnlRjO/Kk8NIp
// SIG // N4shkFQqA1fM08frrDSNEY9VKDtpsUpAF51Y1oQ6tJhW
// SIG // M1d3neCXh6b/6N+XeHORCwnY83K+pFMMhg8isXQb6KRl
// SIG // 65kg8XYBd4JwkbKoVQIDAQABo4IBSTCCAUUwHQYDVR0O
// SIG // BBYEFHR6Wrs27b6+yJ3bEZ9o5NdL1bLwMB8GA1UdIwQY
// SIG // MBaAFJ+nFV0AXmJdg/Tl0mWnG1M1GelyMF8GA1UdHwRY
// SIG // MFYwVKBSoFCGTmh0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvY3JsL01pY3Jvc29mdCUyMFRpbWUtU3Rh
// SIG // bXAlMjBQQ0ElMjAyMDEwKDEpLmNybDBsBggrBgEFBQcB
// SIG // AQRgMF4wXAYIKwYBBQUHMAKGUGh0dHA6Ly93d3cubWlj
// SIG // cm9zb2Z0LmNvbS9wa2lvcHMvY2VydHMvTWljcm9zb2Z0
// SIG // JTIwVGltZS1TdGFtcCUyMFBDQSUyMDIwMTAoMSkuY3J0
// SIG // MAwGA1UdEwEB/wQCMAAwFgYDVR0lAQH/BAwwCgYIKwYB
// SIG // BQUHAwgwDgYDVR0PAQH/BAQDAgeAMA0GCSqGSIb3DQEB
// SIG // CwUAA4ICAQAOuxk47b1i75V81Tx6xo10xNIr4zZxYVfk
// SIG // F5TFq2kndPHgzVyLnssw/HKkEZRCgZVpkKEJ6Y4jvG5t
// SIG // ugMi+Wjt7hUMSipk+RpB5gFQvh1xmAEL2flegzTWEsnj
// SIG // 0wrESplI5Z3vgf2eGXAr/RcqGjSpouHbD2HY9Y3F0Ol6
// SIG // FRDCV/HEGKRHzn2M5rQpFGSjacT4DkqVYmem/ArOfSvV
// SIG // ojnKEIW914UxGtuhJSr9jOo5RqTX7GIqbtvN7zhWld+i
// SIG // 3XxdhdNcflQz9YhoFqQexBenoIRgAPAtwH68xczr9LMC
// SIG // 3l9ALEpnsvO0RiKPXF4l22/OfcFffaphnl/TDwkiJfxO
// SIG // yAMfUF3xI9+3izT1WX2CFs2RaOAq3dcohyJw+xRG0E8w
// SIG // kCHqkV57BbUBEzLX8L9lGJ1DoxYNpoDX7iQzJ9Qdkypi
// SIG // 5fv773E3Ch8A+toxeFp6FifQZyCc8IcIBlHyak6MbT6Y
// SIG // TVQNgQ/h8FF+S5OqP7CECFvIH2Kt2P0GlOu9C0Bfashn
// SIG // TjodmtZFZsptUvirk/2HOLLjBiMjDwJsQAFAzJuz4ZtT
// SIG // yorrvER10Gl/mbmViHqhvNACfTzPiLfjDgyvp9s7/bHu
// SIG // /CalKmeiJULGjh/lwAj5319pggsGJqbhJ4FbFc+oU5zf
// SIG // fbm/rKjVZ8kxND3im10Qp41n2t/qpyP6ETCCB3EwggVZ
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
// SIG // czEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOkYwMDIt
// SIG // MDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBTZXJ2aWNloiMKAQEwBwYFKw4DAhoDFQDV
// SIG // sH9p1tJn+krwCMvqOhVvXrbetKCBgzCBgKR+MHwxCzAJ
// SIG // BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
// SIG // DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
// SIG // ZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29m
// SIG // dCBUaW1lLVN0YW1wIFBDQSAyMDEwMA0GCSqGSIb3DQEB
// SIG // CwUAAgUA7KEIYzAiGA8yMDI1MTAyMDE5MTMzOVoYDzIw
// SIG // MjUxMDIxMTkxMzM5WjB0MDoGCisGAQQBhFkKBAExLDAq
// SIG // MAoCBQDsoQhjAgEAMAcCAQACAhUhMAcCAQACAhIjMAoC
// SIG // BQDsolnjAgEAMDYGCisGAQQBhFkKBAIxKDAmMAwGCisG
// SIG // AQQBhFkKAwKgCjAIAgEAAgMHoSChCjAIAgEAAgMBhqAw
// SIG // DQYJKoZIhvcNAQELBQADggEBACKX1cc1BgAbJAWiQqqg
// SIG // DJAEBmo5T3dfoZd6iEiHxgoN3+JzAsSYiabjw2QSH6cs
// SIG // VOoTNHZI01Niy80s2Sx4rbrti3PkERal9hejKLltftUP
// SIG // cqlrHfk4qU9zvBCv0cmwg484JkEVJ/DT5mulpKwVbjN+
// SIG // AeQiOBbtNOCZSwf3ecRpi2Nj5755ZQYE5I+7cIEtUv3j
// SIG // oFdzvs/CEvSKGlV6Uil+fv13k7hElIk1v6qv1JhCVwVs
// SIG // JL1st2t/D3fM2DY3QpS9qNwAjV4+okk4SXERqd7LkINL
// SIG // zHl0RzyQuvPkPn7DkTersPNz4KQYjIvMkdwQ0AkFTwq3
// SIG // bi1uAUWLnkSQMg4xggQNMIIECQIBATCBkzB8MQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQg
// SIG // VGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAgU8dWyCRIfN
// SIG // /gABAAACBTANBglghkgBZQMEAgEFAKCCAUowGgYJKoZI
// SIG // hvcNAQkDMQ0GCyqGSIb3DQEJEAEEMC8GCSqGSIb3DQEJ
// SIG // BDEiBCBBaDR+WsYEEbK7wWx3L95kX9aohdMm+xwtgbYr
// SIG // DOt0XzCB+gYLKoZIhvcNAQkQAi8xgeowgecwgeQwgb0E
// SIG // IIANAz3ceY0umhdWLR2sJpq0OPqtJDTAYRmjHVkwEW9I
// SIG // MIGYMIGApH4wfDELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQG
// SIG // A1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIw
// SIG // MTACEzMAAAIFPHVsgkSHzf4AAQAAAgUwIgQgU511h/sM
// SIG // HjnkY27zA7vsrAeKSmc8W0HWS0Q4Nqg+/9YwDQYJKoZI
// SIG // hvcNAQELBQAEggIAKNTzBhYmVNa0oxjT2vIoAXJUeyta
// SIG // htIJKxEgycPnKH231Jo5PXxrdJUGzS4GeYiX9Dgs0oT4
// SIG // h4UhEJJDDJgQCjC3r2mY4LxG25vcsMYxe+tmxLKlC6XW
// SIG // REFDjeo1IH0u3sKLhOceTgQs6R8Y4RN1+I/7TbN75piQ
// SIG // wHldkojHRe9XI/hnnac3WJg1e5ckDUFVkoseXMWKDYyl
// SIG // 1qaRzA2ZWDOJF6rYoyGBqFW58pEQ7qz6JOzIt8m3zOil
// SIG // Rx3hEeCw1kgaX8v77E60FA/jMtm6enM/0AmlpRkCEZQD
// SIG // Pv4X0SvPmAAdvMlUlln4dUAGdUM9O6QgYFKMvQgvgYXo
// SIG // dnsWQZSB6O0vC8dCMF3RrxGqtc4kP3SZrHk9yA9plHwl
// SIG // /5JmkM8qc22ZuJ+dFgw6GBczF/g1hYFoJPxgK0XEqOz2
// SIG // GoUksIcMZts1HQhKGYP5Hst5X+51gMrI0LLZcKGAg+wd
// SIG // 8U/garIZql6t+HklPpSFAd8+9vfvPJN60utNao+Cq14x
// SIG // MbmiVgRjPI/1Pf+7V+pNIvIt4YbU6KvIX6fiWp2s92hY
// SIG // MWizdLThr3SRaii//wBP0l7oPqvVRDqSK/bgdm1nqO/V
// SIG // 6394AL0H/HmcuhZVpBepDraG2aOb4bcwZnsikI1MriTC
// SIG // v9gtVFuOnH+oquQjXB2TV3kySXx5Uid/zxQQ8dw=
// SIG // End signature block
