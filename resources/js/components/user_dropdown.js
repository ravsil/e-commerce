document.addEventListener('DOMContentLoaded', function () {
  const dropdownButton = document.getElementById('customDropdownButton')
  const dropdownMenu = document.getElementById('customDropdownMenu')

  if (dropdownButton && dropdownMenu) {
    const toggleDropdown = () => {
      dropdownMenu.classList.toggle('opacity-0')
      dropdownMenu.classList.toggle('-translate-y-2')
      dropdownMenu.classList.toggle('pointer-events-none')
    }

    dropdownButton.addEventListener('click', (event) => {
      event.stopPropagation()
      toggleDropdown()
    })

    window.addEventListener('click', function (event) {
      // If the menu is open and the click is outside, close it
      if (!dropdownMenu.classList.contains('opacity-0')) {
        if (!dropdownButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
          toggleDropdown()
        }
      }
    })
  }
})