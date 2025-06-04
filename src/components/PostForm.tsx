import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, addDoc, updateDoc, collection } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { Post } from '../types';

interface PostFormProps {
  post?: Post;
}

const PostForm: React.FC<PostFormProps> = ({ post }) => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();

  const [formData, setFormData] = useState<Partial<Post>>({
    title: '',
    description: '',
    requirements: [],
    location: '',
    salary: '',
    employmentType: 'full-time',
    status: 'active',
    skills: [],
  });

  useEffect(() => {
    if (post) {
      setFormData(post);
    } else if (id) {
      const fetchPost = async () => {
        const postDoc = await getDoc(doc(db, 'posts', id));
        if (postDoc.exists()) {
          setFormData(postDoc.data() as Post);
        }
      };
      fetchPost();
    }
  }, [post, id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skills = e.target.value.split(',').map(skill => skill.trim());
    setFormData(prev => ({
      ...prev,
      skills: skills
    }));
  };

  const handleRequirementsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const requirements = e.target.value.split('\n').filter(line => line.trim());
    setFormData(prev => ({
      ...prev,
      requirements: requirements
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const postData = {
        ...formData,
        createdAt: post ? post.createdAt : new Date(),
        updatedAt: new Date(),
        createdBy: user.uid
      };

      if (post || id) {
        await updateDoc(doc(db, 'posts', post?.id || id || ''), postData);
      } else {
        await addDoc(collection(db, 'posts'), postData);
      }

      navigate('/posts');
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-8">
        {post || id ? t('posts.editPost') : t('posts.newPost')}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('posts.title')}
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('posts.description')}
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('posts.requirements')}
          </label>
          <textarea
            name="requirements"
            value={Array.isArray(formData.requirements) ? formData.requirements.join('\n') : ''}
            onChange={handleRequirementsChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            rows={4}
            placeholder="Enter each requirement on a new line"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('posts.location')}
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('posts.salary')}
            </label>
            <input
              type="text"
              name="salary"
              value={formData.salary}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('posts.type')}
            </label>
            <select
              name="employmentType"
              value={formData.employmentType}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              required
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('posts.status')}
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              required
            >
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Skills (comma separated)
          </label>
          <input
            type="text"
            name="skills"
            value={Array.isArray(formData.skills) ? formData.skills.join(', ') : ''}
            onChange={handleSkillsChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            placeholder="e.g. React, TypeScript, Node.js"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/posts')}
            className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {post || id ? t('posts.updatePost') : t('posts.createPost')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostForm; 