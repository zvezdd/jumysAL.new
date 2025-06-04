import React from 'react';

const About = () => {
  const teamMembers = [
    {
      name: 'Ansar',
      role: 'Founder & CEO',
      image: '/assets/team/ansar.jpg', // Add appropriate images
      bio: 'Computer Science student with a passion for connecting students with employment opportunities.',
      social: {
        linkedin: '#',
        twitter: '#',
        github: '#',
      }
    },
    {
      name: 'Ibragim',
      role: 'coder',
      image: '/assets/team/ibragim.jpg',
      bio: 'Software engineer specializing in building scalable web applications with modern technologies.',
      social: {
        linkedin: '#',
        twitter: '#',
        github: '#',
      }
    },
    {
      name: 'Talgatov Daniyal',
      role: 'Coder',
      image: '/assets/team/daniyal.jpg',
      bio: 'chill guy.',
      social: {
        linkedin: '#',
        twitter: '#',
        github: '#',
      }
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark py-16">
      <div className="container max-w-6xl mx-auto px-4">
        {/* About JumysAL section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              About <span className="text-primary">JumysAL</span>
            </h1>
            <div className="w-20 h-1 bg-primary mx-auto rounded"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="w-full h-[350px] bg-primary/10 rounded-2xl overflow-hidden shadow-lg">
                <img 
                  src="/assets/jumysal-mission.jpg" 
                  alt="JumysAL Mission" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/20 rounded-full"></div>
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-accent/20 rounded-full"></div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
              <p className="text-gray-600 dark:text-gray-300">
                At JumysAL, we are dedicated to bridging the gap between talented students and potential 
                employers. Our platform serves as a catalyst for students to gain valuable work experience 
                while helping businesses find fresh, motivated talent.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                We believe that every student deserves the opportunity to apply their academic knowledge 
                in real-world settings, developing crucial skills that will shape their future careers. 
                By connecting students with businesses, we aim to create a thriving ecosystem that benefits both parties.
              </p>
              <div className="pt-4">
                <a 
                  href="/jobs" 
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300"
                >
                  Explore Opportunities
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Our Story */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Our Story</h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded"></div>
          </div>
          
          <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-lg p-8 md:p-12">
            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                The idea for JumysAL was born from our own experiences as students struggling to find 
                meaningful part-time work that complements our studies. We recognized that many businesses 
                are eager to work with students but lack the right channels to reach them.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Founded in 2023 by a group of university students in Almaty, Kazakhstan, JumysAL started 
                as a small project to address this challenge in our own community. The positive response 
                we received inspired us to expand our vision and build a comprehensive platform that serves 
                students and businesses across the country.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                What sets JumysAL apart is our deep understanding of the student experience and our 
                commitment to fostering a supportive environment for career development. We're not just 
                a job board - we're a community that values growth, learning, and collaboration.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Today, JumysAL continues to grow, guided by our founding principles of accessibility, 
                quality, and innovation. We're constantly evolving to better serve our users and create 
                more opportunities for students to thrive in the professional world.
              </p>
            </div>
          </div>
        </div>
        
        {/* Our Values */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Our Values</h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="mb-6 w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Community First</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We believe in the power of community and collaboration. Our platform is designed to foster 
                connections and create a supportive environment for both students and businesses.
              </p>
            </div>
            
            <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="mb-6 w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Trust & Quality</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We maintain high standards for the opportunities listed on our platform, ensuring that 
                students have access to meaningful experiences that contribute to their professional growth.
              </p>
            </div>
            
            <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="mb-6 w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Innovation</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We embrace technology and innovation to create the most effective platform for connecting 
                students with opportunities. Our AI-powered resume generator is just one example of how 
                we're using technology to enhance the user experience.
              </p>
            </div>
          </div>
        </div>
        
        {/* Team section */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Our Team</h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded mb-6"></div>
            <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Meet the passionate individuals behind JumysAL. Our diverse team brings together expertise in 
              technology, design, and student affairs to create the best possible platform for our users.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white dark:bg-dark-lighter rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl">
                <div className="h-60 overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-110"
                    onError={(e) => {
                      // Fallback if image doesn't load
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0D8ABC&color=fff&size=256`;
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{member.name}</h3>
                  <p className="text-primary mb-3">{member.role}</p>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{member.bio}</p>
                  <div className="flex space-x-4">
                    <a href={member.social.linkedin} className="text-gray-400 hover:text-primary transition-colors duration-300">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                      </svg>
                    </a>
                    <a href={member.social.twitter} className="text-gray-400 hover:text-primary transition-colors duration-300">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                      </svg>
                    </a>
                    <a href={member.social.github} className="text-gray-400 hover:text-primary transition-colors duration-300">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Join Us CTA */}
        <div className="mt-20 py-16 px-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Join Us on Our Mission</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Whether you're a student looking for opportunities or a business seeking fresh talent, 
            JumysAL is here to help you succeed. Join our growing community today!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="/register" 
              className="px-8 py-3 bg-primary text-white font-medium rounded-lg shadow hover:bg-primary-dark transition-colors duration-300"
            >
              Sign Up Now
            </a>
            <a 
              href="/contact" 
              className="px-8 py-3 bg-white dark:bg-dark text-primary font-medium rounded-lg shadow border border-primary hover:bg-primary/5 transition-colors duration-300"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 