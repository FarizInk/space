var ghpages = require('gh-pages');

ghpages.publish(
    'space', // path to deploy directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/FarizInk/space.git', // Update to point to your repository  
        user: {
            name: 'Fariz', // update to use your name
            email: 'nizaralfariziakbar10@gmail.com' // Update to use your email
        },
        history: false,
    },
    (err) => {
        console.log(err)
        console.log('Deploy Complete!')
    }
)