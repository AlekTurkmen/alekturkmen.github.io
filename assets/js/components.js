class Components {
    static async loadComponent(elementId, componentPath) {
        try {
            const response = await fetch(componentPath);
            const html = await response.text();
            
            // Check if we're in a subdirectory and how deep
            const pathParts = window.location.pathname.split('/');
            const isDoubleSubdirectory = pathParts.includes('streaming') || pathParts.includes('other-double-nested-dir');
            const isSubdirectory = window.location.pathname.includes('/projects/') || 
                                 window.location.pathname.includes('/experiences/') ||
                                 window.location.pathname.includes('/blogs/');
            
            // Modify paths based on directory depth
            let modifiedHtml = html;
            if (isDoubleSubdirectory) {
                modifiedHtml = html
                    .replace(/src="images\//g, 'src="../../images/')
                    .replace(/src="([^"]*avatar\.jpg)"/g, 'src="../../images/avatar.jpg"')
                    .replace(/href="([^"]+)\.html/g, 'href="$1/')
                    .replace(/href="javascript:void\(0\)"/g, 'href="../../"');
            } else if (isSubdirectory) {
                modifiedHtml = html
                    .replace(/src="images\//g, 'src="../images/')
                    .replace(/src="([^"]*avatar\.jpg)"/g, 'src="../images/avatar.jpg"')
                    .replace(/href="([^"]+)\.html/g, 'href="$1/')
                    .replace(/href="javascript:void\(0\)"/g, 'href="../"');
            }
            
            document.getElementById(elementId).innerHTML = modifiedHtml;

            // Re-initialize the header specific JavaScript
            if (elementId === 'headerComponent') {
                // Wait for jQuery and main.js to be fully loaded
                if (typeof $ !== 'undefined') {
                    const $header = $('#header');
                    const $nav = $('#nav');
                    const $nav_a = $nav.find('a');

                    // Reinitialize nav links with modified click handler
                    $nav_a
                        .addClass('scrolly')
                        .on('click', function(e) {
                            e.preventDefault();
                            var $this = $(this);
                            const targetId = $this.attr('data-scroll');

                            // Check if we're on a subpage
                            const isSubpage = window.location.pathname.includes('/projects/') || 
                                             window.location.pathname.includes('/experiences/') ||
                                             window.location.pathname.includes('/blogs/');

                            if (isSubpage) {
                                // If on a subpage, navigate back to main page with section
                                const depth = window.location.pathname.split('/').length - 2;
                                const prefix = '../'.repeat(depth);
                                // Store the target section in sessionStorage
                                sessionStorage.setItem('scrollTarget', targetId);
                                window.location.href = prefix + 'index.html';
                            } else {
                                // On main page, scroll to section
                                const $targetSection = $('#' + targetId);
                                if ($targetSection.length) {
                                    $('html, body').animate({
                                        scrollTop: $targetSection.offset().top - ($('#titleBar').height() || 0)
                                    }, 1000);

                                    // Deactivate all links
                                    $nav_a.removeClass('active');

                                    // Activate link *and* lock it
                                    $this
                                        .addClass('active')
                                        .addClass('active-locked');
                                }
                            }
                        });

                    // Initialize panel
                    $header.panel({
                        delay: 500,
                        hideOnClick: true,
                        hideOnSwipe: true,
                        resetScroll: true,
                        resetForms: true,
                        side: 'right',
                        target: $('body'),
                        visibleClass: 'header-visible'
                    });

                    // Initialize scrolly
                    $('.scrolly').scrolly({
                        speed: 1000,
                        offset: function() {
                            if (breakpoints.active('<=medium'))
                                return $('#titleBar').height();
                            return 0;
                        }
                    });

                    // Add this after the nav click handler
                    $('.home-link').on('click', function(e) {
                        e.preventDefault();
                        const isSubpage = window.location.pathname.includes('/projects/') || 
                                         window.location.pathname.includes('/experiences/') ||
                                         window.location.pathname.includes('/blogs/');
                        
                        if (isSubpage) {
                            const depth = window.location.pathname.split('/').length - 2;
                            const prefix = '../'.repeat(depth);
                            window.location.href = prefix + 'index.html';
                        } else {
                            // On main page, scroll to top
                            $('html, body').animate({
                                scrollTop: 0
                            }, 1000);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error loading component:', error);
        }
    }
}