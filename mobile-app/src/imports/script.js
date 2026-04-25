document.addEventListener('DOMContentLoaded', () => {
    const viewport = document.getElementById('viewport');
    const dots = [document.getElementById('dot0'), document.getElementById('dot1')];
    const dashboardView = document.getElementById('dashboardView');
    const indicator = document.querySelector('.page-indicator');
    
    let currentIndex = 0;
    let startX = 0;
    let isDragging = false;
    let startTime = 0;
    let indicatorTimer = null;

    // 智能隐藏指示器逻辑
    function showIndicator() {
        indicator.classList.add('visible');
        clearTimeout(indicatorTimer);
        indicatorTimer = setTimeout(() => {
            indicator.classList.remove('visible');
        }, 2000);
    }

    // 滑动交互：支持物理感滑动
    document.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startTime = Date.now();
        isDragging = true;
        viewport.style.transition = 'none';
        showIndicator();
    }, { passive: true });

    document.addEventListener('touchmove', e => {
        if (!isDragging) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        
        let moveX = -currentIndex * window.innerWidth + diff;
        if ((currentIndex === 0 && diff > 0) || (currentIndex === 1 && diff < 0)) {
            moveX = -currentIndex * window.innerWidth + diff * 0.3;
        }
        
        viewport.style.transform = `translateX(${moveX}px)`;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        if (!isDragging) return;
        isDragging = false;
        
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        const duration = Date.now() - startTime;
        
        const velocity = Math.abs(diff) / duration;
        const shouldSwitch = Math.abs(diff) > window.innerWidth * 0.25 || velocity > 0.5;

        viewport.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
        
        if (shouldSwitch) {
            if (diff > 0 && currentIndex === 0) switchView(1);
            else if (diff < 0 && currentIndex === 1) switchView(0);
            else switchView(currentIndex);
        } else {
            switchView(currentIndex);
        }
    });

    function switchView(index) {
        currentIndex = index;
        viewport.style.transform = `translateX(-${index * 100}vw)`;
        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
        showIndicator();
        
        if (index === 0) {
            const animElements = dashboardView.querySelectorAll('.kpi-card-large, .chart-bar-mock span');
            animElements.forEach(el => {
                el.style.animation = 'none';
                void el.offsetWidth;
                el.style.animation = '';
            });
        }
    }

    // 对话逻辑
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');

    function addMessage(type, text) {
        const bubble = document.createElement('div');
        bubble.className = `bubble ${type}`;
        bubble.textContent = text;
        chatMessages.appendChild(bubble);
        
        setTimeout(() => {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 50);
    }

    function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;

        addMessage('user', text);
        userInput.value = '';

        const typingBubble = document.createElement('div');
        typingBubble.className = 'bubble ai';
        typingBubble.innerHTML = '<span class="typing-dots">系统分析中...</span>';
        typingBubble.style.opacity = '0.6';
        chatMessages.appendChild(typingBubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        setTimeout(() => {
            chatMessages.removeChild(typingBubble);
            let reply = "收到，正在为您调取实时数据...";
            if (text.includes("告警")) {
                reply = "深度分析显示：嘉定电站的电流波动由局部阴影遮挡引起，由于今日光照强烈，波动在安全范围内，已为您标记为‘待观察’。";
            } else if (text.includes("报告") || text.includes("摘要")) {
                reply = "好的，为您汇总今日运营数据：截止目前发电 94.7MWh，全站效率 98.2%，无重大故障风险。";
            }
            addMessage('ai', reply);
        }, 1200);
    }

    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    userInput.addEventListener('focus', () => {
        setTimeout(() => {
            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
        }, 100);
    });
});
