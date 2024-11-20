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
                modifiedHtml = html.replace(/href="#/g, 'href="../../index.html#')
                                 .replace(/src="images\//g, 'src="../../images/');
            } else if (isSubdirectory) {
                modifiedHtml = html.replace(/href="#/g, 'href="../index.html#')
                                 .replace(/src="images\//g, 'src="../images/');
            }
            
            document.getElementById(elementId).innerHTML = modifiedHtml;

            // Re-initialize the header specific JavaScript
            if (elementId === 'headerComponent') {
                // Wait for jQuery and main.js to be fully loaded
                if (typeof $ !== 'undefined') {
                    const $header = $('#header');
                    const $nav = $('#nav');
                    const $nav_a = $nav.find('a');

                    // Reinitialize nav links
                    $nav_a
                        .addClass('scrolly')
                        .on('click', function() {
                            var $this = $(this);

                            // External link? Bail.
                            if ($this.attr('href').charAt(0) != '#')
                                return;

                            // Deactivate all links.
                            $nav_a.removeClass('active');

                            // Activate link *and* lock it
                            $this
                                .addClass('active')
                                .addClass('active-locked');
                        })
                        .each(function() {
                            var $this = $(this),
                                id = $this.attr('href'),
                                $section = $(id);

                            // No section for this link? Bail.
                            if ($section.length < 1)
                                return;

                            // Scrollex
                            $section.scrollex({
                                mode: 'middle',
                                top: '5vh',
                                bottom: '5vh',
                                initialize: function() {
                                    $section.addClass('inactive');
                                },
                                enter: function() {
                                    $section.removeClass('inactive');
                                    if ($nav_a.filter('.active-locked').length == 0) {
                                        $nav_a.removeClass('active');
                                        $this.addClass('active');
                                    }
                                    else if ($this.hasClass('active-locked'))
                                        $this.removeClass('active-locked');
                                }
                            });
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
                }
            }
        } catch (error) {
            console.error('Error loading component:', error);
        }
    }
}